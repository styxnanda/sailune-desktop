package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	sailune "github.com/styxnanda/sailune-go"
	"os"

	"github.com/styxnanda/sailune-desktop/internal/desktop"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx     context.Context
	service desktop.Service
}

func (a *App) startup(ctx context.Context) { a.ctx = ctx }
func (a *App) shutdown(context.Context)    { a.service.Cancel() }
func (a *App) Cancel()                     { a.service.Cancel() }
func (a *App) Call(action, payload string) (string, error) {
	result, err := a.service.Call(a.ctx, action, payload)
	if err != nil {
		return "", err
	}
	data, err := json.Marshal(result)
	return string(data), err
}

// URLs are always resolved by the core, never accepted from frontend content.
func (a *App) Open(action, payload string) error {
	if action != "resolve" && action != "login" {
		return errors.New("unsupported browser action")
	}
	result, err := a.service.Call(a.ctx, action, payload)
	if err != nil {
		return err
	}
	runtime.BrowserOpenURL(a.ctx, result.(string))
	return nil
}
func (a *App) Pick(kind string) (string, error) {
	switch kind {
	case "image":
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{Title: "Choose artwork", Filters: []runtime.FileFilter{{DisplayName: "JPEG or PNG", Pattern: "*.jpg;*.jpeg;*.png"}}})
	case "export":
		return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{Title: "Export library snapshot", DefaultFilename: "sailune-backup.zip", Filters: []runtime.FileFilter{{DisplayName: "Sailune backup", Pattern: "*.zip"}}})
	case "directory":
		return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{Title: "Choose directory"})
	case "database":
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{Title: "Choose a library"})
	case "new-database":
		return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{Title: "Choose existing or new SQLite library", DefaultFilename: "library.sqlite3"})
	default:
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{Title: "Choose file"})
	}
}

// Confirm uses a native dialog because browser confirm support differs by webview.
func (a *App) Confirm(message string) (bool, error) {
	answer, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{Type: runtime.QuestionDialog, Title: "Sailune", Message: message, Buttons: []string{"Cancel", "Continue"}, DefaultButton: "Cancel", CancelButton: "Cancel"})
	return answer == "Continue", err
}

// Copy only accepts core-resolved story links or a selected bookmark's data.
func (a *App) Copy(action, payload string) error {
	if action != "resolve" && action != "get" {
		return errors.New("unsupported copy action")
	}
	result, err := a.service.Call(a.ctx, action, payload)
	if err != nil {
		return err
	}
	value, ok := result.(string)
	if !ok {
		data, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			return err
		}
		value = string(data)
	}
	return runtime.ClipboardSetText(a.ctx, value)
}

func (a *App) ArtworkInfo(data string, id int64) (string, error) {
	v, e := (sailune.Library{Store: sailune.Store{Path: data}}).Artwork(id)
	if e != nil {
		return "", e
	}
	b, e := json.Marshal(v)
	return string(b), e
}
func (a *App) ArtworkData(data, asset string, small bool) (string, error) {
	b, e := (sailune.Library{Store: sailune.Store{Path: data}}).ArtworkBytes(asset, small)
	if e != nil {
		return "", e
	}
	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(b), nil
}
func (a *App) PreviewArtwork(path, role string, x, y float64) (string, error) {
	f, e := os.Open(path)
	if e != nil {
		return "", e
	}
	defer f.Close()
	b, e := sailune.PreviewArtwork(f, role, x, y)
	if e != nil {
		return "", e
	}
	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(b), nil
}
