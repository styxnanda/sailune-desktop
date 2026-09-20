// Package desktop adapts GUI requests to the authoritative Sailune-Go library.
package desktop

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/styxnanda/sailune-go/browser"
	"os"
	"path/filepath"
	"sync"

	sailune "github.com/styxnanda/sailune-go"
)

type Config struct {
	Data      string
	Sessions  string
	UserAgent string
}
type Request struct {
	Feature  sailune.OrganizeRequest
	Config   Config
	Filter   sailune.Filter
	Bookmark sailune.Bookmark
	Patch    sailune.Patch
	ID       int64
	Chapter  int
	Resume   bool
	Fetch    bool
	Path     string
	Merge    bool
	Site     sailune.Site
	Browser  string
	Consent  bool
}
type Entry struct {
	sailune.Bookmark
	Effective sailune.Metadata `json:"effective"`
	Progress  sailune.Progress `json:"progress"`
}

func entry(b sailune.Bookmark) Entry { return Entry{b, b.EffectiveMetadata(), b.ReadingProgress()} }

// A single active operation keeps cancellation unambiguous. SQLite remains the
// inter-process authority; no GUI copy of bookmark state is persisted.
type Service struct {
	mu         sync.Mutex
	cancel     context.CancelFunc
	browser    *sailune.BrowserRecovery
	browserDir string
	fetcher    sailune.MetadataFetcher // optional injected transport for adapter tests
}

func (s *Service) Cancel() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cancel != nil {
		s.cancel()
	}
}
func Defaults() (Config, error) {
	c := Config{Data: os.Getenv("SAILUNE_DATA"), Sessions: os.Getenv("SAILUNE_SESSIONS"), UserAgent: os.Getenv("SAILUNE_USER_AGENT")}
	var err error
	if c.Data == "" {
		c.Data, err = sailune.DefaultLibraryPath()
		if err != nil {
			return c, err
		}
	}
	if c.Sessions == "" {
		c.Sessions, err = sailune.DefaultSessionDir()
	}
	return c, err
}
func (s *Service) Call(parent context.Context, action, payload string) (any, error) {
	s.mu.Lock()
	if s.cancel != nil {
		s.mu.Unlock()
		return nil, errors.New("another operation is running")
	}
	ctx, cancel := context.WithCancel(parent)
	s.cancel = cancel
	s.mu.Unlock()
	defer func() { cancel(); s.mu.Lock(); s.cancel = nil; s.mu.Unlock() }()
	if action == "defaults" {
		return Defaults()
	}
	var r Request
	if err := json.Unmarshal([]byte(payload), &r); err != nil {
		return nil, err
	}
	if r.Config.Data == "" || r.Config.Sessions == "" {
		return nil, errors.New("library and session paths are required")
	}
	if !filepath.IsAbs(r.Config.Data) || !filepath.IsAbs(r.Config.Sessions) {
		return nil, errors.New("use absolute library and session paths")
	}
	lib := sailune.Library{Store: sailune.Store{Path: r.Config.Data}}
	sessions := sailune.SessionStore{Dir: r.Config.Sessions}
	if s.browser == nil || s.browserDir != r.Config.Sessions {
		s.browserDir = r.Config.Sessions
		s.browser = &sailune.BrowserRecovery{Loader: &browser.Chromium{Profile: filepath.Join(r.Config.Sessions, "ffn-browser")}}
	}
	var scraper sailune.MetadataFetcher = &sailune.Scraper{Sessions: sessions, UserAgent: r.Config.UserAgent, Browser: s.browser}
	if s.fetcher != nil {
		scraper = s.fetcher
	}
	switch action {
	case "organize":
		return lib.Organize(r.Feature)
	case "list":
		if r.Filter.Limit == 0 {
			r.Filter.Limit = 50
		}
		if r.Filter.Limit > 200 {
			return nil, errors.New("page size cannot exceed 200")
		}
		bs, err := lib.List(r.Filter)
		if err != nil {
			return nil, err
		}
		result := make([]Entry, 0, len(bs))
		for _, b := range bs {
			result = append(result, entry(b))
		}
		return result, nil
	case "get":
		b, err := lib.Get(r.ID)
		return entry(b), err
	case "add":
		var b sailune.Bookmark
		var err error
		if r.Fetch {
			b, err = lib.AddScraped(ctx, r.Bookmark, scraper)
		} else {
			b, err = lib.Add(r.Bookmark)
		}
		return entry(b), err
	case "update":
		b, err := lib.Update(r.ID, r.Patch)
		return entry(b), err
	case "refresh":
		b, err := lib.Refresh(ctx, r.ID, scraper)
		return entry(b), err
	case "delete":
		return nil, lib.Delete(r.ID)
	case "resolve":
		if r.Resume {
			return lib.ResumeURL(r.ID)
		}
		return lib.OpenURL(r.ID, r.Chapter)
	case "export":
		return nil, lib.ExportArchiveFile(r.Path)
	case "import":
		return lib.ImportBackupFile(r.Path, r.Merge)
	case "session-status":
		return sessions.Status(r.Site)
	case "login":
		return sailune.LoginURL(r.Site)
	case "session-clear":
		if !r.Consent {
			return nil, errors.New("confirm clearing the session")
		}
		return nil, sessions.Clear(r.Site)
	case "session-browser":
		if !r.Consent {
			return nil, errors.New("consent is required to import browser cookies")
		}
		return sessions.ImportBrowser(ctx, r.Site, r.Browser)
	case "session-file":
		if !r.Consent {
			return nil, errors.New("consent is required to import cookies")
		}
		f, err := os.Open(r.Path)
		if err != nil {
			return nil, err
		}
		defer f.Close()
		return sessions.Import(r.Site, f)
	case "session-migrate":
		if !r.Consent {
			return nil, errors.New("confirm migration and removal of the legacy session")
		}
		return sessions.Migrate(r.Site, r.Path)
	default:
		return nil, errors.New("unknown desktop action")
	}
}
