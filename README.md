# firefox-ctrlnumber

Keyboard shortcuts to switch Firefox tabs by number:

- **Ctrl+1…8** — unpinned tabs (first through eighth)
- **Ctrl+9** — last unpinned tab
- **Alt+Shift+1…8** — pinned tabs (first through eighth)
- **Alt+Shift+9** — last pinned tab

On macOS, Ctrl is Command and Alt is Option. Shortcuts can also be remapped at `about:addons` → gear → Manage Extension Shortcuts.

The XPI is unsigned. Install it with Firefox enterprise policy (`ExtensionSettings`), which is how home-manager already installs your other add-ons. Policy-installed add-ons do not need Mozilla signing.

## GitHub Release → home-manager

Fork this repo, push, tag a release. CI zips `src/` into `firefox-ctrlnumber.xpi` and attaches it to the GitHub Release. Firefox then downloads that file the same way it downloads AMO XPIs.

```bash
git remote set-url origin git@github.com:shwewo/firefox-ctrlnumber.git
git add -A
git commit -m "Switch pinned tabs with Alt+Shift+Number"
git push -u origin master
git tag v1.1.0
git push origin v1.1.0
```

The `v*` tag triggers `.github/workflows/release.yml`. The download URL is:

```
https://github.com/shwewo/firefox-ctrlnumber/releases/latest/download/firefox-ctrlnumber.xpi
```

In your Firefox module, replace the AMO add-on with that URL and block the old id:

```nix
ExtensionSettings =
  with builtins;
  let
    extension = shortId: uuid: {
      name = uuid;
      value = {
        install_url = "https://addons.mozilla.org/en-US/firefox/downloads/latest/${shortId}/latest.xpi";
        installation_mode = "normal_installed";
      };
    };
  in
  listToAttrs [
    (extension "ublock-origin" "uBlock0@raymondhill.net")
    # ...your other AMO extensions...

    # uninstall the AMO build of this add-on
    {
      name = "{84601290-bec9-494a-b11c-1baa897a9683}";
      value = {
        installation_mode = "blocked";
      };
    }

    # this fork, from the GitHub Release
    {
      name = "ctrl-number-to-switch-tabs@shwewo";
      value = {
        install_url = "https://github.com/shwewo/firefox-ctrlnumber/releases/latest/download/firefox-ctrlnumber.xpi";
        installation_mode = "force_installed";
      };
    }
  ];
```

`force_installed` is required for an unsigned XPI. Restart Firefox after `home-manager switch` and check `about:addons` / `about:policies` for `ctrl-number-to-switch-tabs@shwewo`.

To ship a new version: bump `src/manifest.json` `version`, tag `v1.1.1`, push the tag.

## Building from source

    (cd src && zip -X -r ../firefox-ctrlnumber.xpi .)

    bun install && bun run test && bun run build
    # web-ext-artifacts/*.zip  — rename to .xpi if you upload it by hand

    nix build   # ./result is the .xpi
