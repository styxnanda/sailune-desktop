package desktop

import (
	"context"
	"encoding/json"
	"errors"
	"path/filepath"
	"testing"

	sailune "github.com/styxnanda/sailune-go"
)

func testConfig(t *testing.T) Config {
	t.Helper()
	d := t.TempDir()
	return Config{Data: filepath.Join(d, "library.sqlite3"), Sessions: filepath.Join(d, "sessions")}
}
func invoke(t *testing.T, s *Service, action string, r Request) (any, error) {
	t.Helper()
	b, e := json.Marshal(r)
	if e != nil {
		t.Fatal(e)
	}
	return s.Call(context.Background(), action, string(b))
}
func TestDesktopLifecycleSharesCoreAndTransfers(t *testing.T) {
	s := &Service{}
	c := testConfig(t)
	r := Request{Config: c, Bookmark: sailune.Bookmark{URL: "https://www.fanfiction.net/s/12345/1", Title: "An offline story", Tags: []string{"comfort"}}}
	v, err := invoke(t, s, "add", r)
	if err != nil {
		t.Fatal(err)
	}
	b := v.(Entry)
	r.ID = b.ID
	// A CLI/library edit between GUI reads must survive an unrelated GUI patch.
	core := sailune.Library{Store: sailune.Store{Path: c.Data}}
	notes := "written in CLI"
	if _, err = core.Update(b.ID, sailune.Patch{Notes: &notes}); err != nil {
		t.Fatal(err)
	}
	chapter := 2
	count := 8
	rating := 5
	r.Patch = sailune.Patch{Chapter: &chapter, Rating: &rating, Overrides: &sailune.MetadataPatch{Chapters: &count}}
	v, err = invoke(t, s, "update", r)
	if err != nil {
		t.Fatal(err)
	}
	b = v.(Entry)
	if b.Notes != notes || b.Progress.Unread != 6 || b.Rating != 5 {
		t.Fatalf("bad adapter result: %+v", b)
	}
	r.Resume = true
	v, err = invoke(t, s, "resolve", r)
	if err != nil || v != "https://www.fanfiction.net/s/12345/3" {
		t.Fatalf("%v %v", v, err)
	}
	r.Filter = sailune.Filter{Tag: "comfort", MinRating: 5, Unread: true}
	v, err = invoke(t, s, "list", r)
	if err != nil || len(v.([]Entry)) != 1 {
		t.Fatalf("%v %v", v, err)
	}
	r.Path = filepath.Join(t.TempDir(), "snapshot.json")
	if _, err = invoke(t, s, "export", r); err != nil {
		t.Fatal(err)
	}
	if _, err = invoke(t, s, "export", r); err == nil {
		t.Fatal("export overwrote existing snapshot")
	}
	r.Config = testConfig(t)
	v, err = invoke(t, s, "import", r)
	if err != nil || v.(sailune.ImportResult).Imported != 1 {
		t.Fatalf("%v %v", v, err)
	}
	r.Merge = true
	v, err = invoke(t, s, "import", r)
	if err != nil || v.(sailune.ImportResult).Skipped != 1 {
		t.Fatalf("%v %v", v, err)
	}
	if _, err = invoke(t, s, "delete", r); err != nil {
		t.Fatal(err)
	}
	if _, err = invoke(t, s, "get", r); err == nil {
		t.Fatal("deleted bookmark found")
	}
}
func TestAdapterRejectsUnsafeOrInvalidRequests(t *testing.T) {
	s := &Service{}
	r := Request{Config: testConfig(t), Site: sailune.AO3}
	for _, action := range []string{"session-browser", "session-file", "session-clear", "session-migrate"} {
		if _, err := invoke(t, s, action, r); err == nil {
			t.Errorf("%s accepted missing consent", action)
		}
	}
	r.Filter.Limit = 201
	if _, err := invoke(t, s, "list", r); err == nil {
		t.Fatal("unbounded page accepted")
	}
	r.Config.Data = "relative.db"
	if _, err := invoke(t, s, "list", r); err == nil {
		t.Fatal("relative database accepted")
	}
	if _, err := s.Call(context.Background(), "list", "{"); err == nil {
		t.Fatal("invalid JSON accepted")
	}
}
func TestInvalidUpdateIsAtomicAndOverridesReset(t *testing.T) {
	s := &Service{}
	r := Request{Config: testConfig(t), Bookmark: sailune.Bookmark{URL: "https://archiveofourown.org/works/123", Title: "Original"}}
	v, err := invoke(t, s, "add", r)
	if err != nil {
		t.Fatal(err)
	}
	r.ID = v.(Entry).ID
	title := "Changed"
	badRating := 6
	r.Patch = sailune.Patch{Title: &title, Rating: &badRating}
	if _, err = invoke(t, s, "update", r); err == nil {
		t.Fatal("bad rating accepted")
	}
	v, err = invoke(t, s, "get", r)
	if err != nil || v.(Entry).Title != "Original" {
		t.Fatal("failed update changed record")
	}
	words := 123
	r.Patch = sailune.Patch{Overrides: &sailune.MetadataPatch{Words: &words}}
	if _, err = invoke(t, s, "update", r); err != nil {
		t.Fatal(err)
	}
	reset := "words"
	r.Patch = sailune.Patch{ResetOverrides: &reset}
	v, err = invoke(t, s, "update", r)
	if err != nil || v.(Entry).Effective.Words != 0 {
		t.Fatal("reset failed")
	}
}

type fetchFunc func(context.Context, string) (sailune.Metadata, error)

func (f fetchFunc) Fetch(ctx context.Context, u string) (sailune.Metadata, error) { return f(ctx, u) }
func TestFetchCancellationAndFailureDoNotCreateBookmarks(t *testing.T) {
	started := make(chan struct{})
	s := &Service{fetcher: fetchFunc(func(ctx context.Context, _ string) (sailune.Metadata, error) {
		close(started)
		<-ctx.Done()
		return sailune.Metadata{}, ctx.Err()
	})}
	r := Request{Config: testConfig(t), Fetch: true, Bookmark: sailune.Bookmark{URL: "https://archiveofourown.org/works/321"}}
	payload, _ := json.Marshal(r)
	finished := make(chan error, 1)
	go func() { _, err := s.Call(context.Background(), "add", string(payload)); finished <- err }()
	<-started
	if _, err := invoke(t, s, "list", r); err == nil {
		t.Fatal("concurrent operation accepted")
	}
	s.Cancel()
	if err := <-finished; !errors.Is(err, context.Canceled) {
		t.Fatalf("expected cancellation, got %v", err)
	}
	s.fetcher = fetchFunc(func(context.Context, string) (sailune.Metadata, error) {
		return sailune.Metadata{}, errors.New("synthetic fetch failure")
	})
	if _, err := invoke(t, s, "add", r); err == nil {
		t.Fatal("failed fetch succeeded")
	}
	v, err := invoke(t, s, "list", r)
	if err != nil || len(v.([]Entry)) != 0 {
		t.Fatalf("failed fetch saved bookmark: %v %v", v, err)
	}
}
