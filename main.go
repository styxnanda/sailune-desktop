package main

import (
	"embed"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"log"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	app := &App{}
	err := wails.Run(&options.App{Title: "Sailune", Width: 1280, Height: 840, MinWidth: 960, MinHeight: 640,
		BackgroundColour: &options.RGBA{R: 18, G: 20, B: 28, A: 255},
		AssetServer:      &assetserver.Options{Assets: assets}, OnStartup: app.startup, OnShutdown: app.shutdown, Bind: []interface{}{app},
		Linux: &linux.Options{Icon: icon, ProgramName: "sailune-desktop"},
	})
	if err != nil {
		log.Fatal(err)
	}
}
