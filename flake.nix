{
  description = "Firefox Ctrl+Number tab switcher with Alt+Shift shortcuts for pinned tabs";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      addonId = "ctrl-number-to-switch-tabs@shwewo";
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;

      mkXpi =
        pkgs:
        pkgs.runCommand "firefox-ctrlnumber.xpi" {
          src = ./src;
          nativeBuildInputs = [ pkgs.zip ];
          preferLocalBuild = true;
          allowSubstitutes = false;
          passthru = {
            inherit addonId;
          };
        } ''
          (cd "$src" && zip -X -r "$out" .)
        '';
    in
    {
      inherit addonId;

      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          default = mkXpi pkgs;
        in
        {
          inherit default;
          firefox-ctrlnumber = default;
        }
      );

      homeManagerModules.default =
        {
          pkgs,
          lib,
          config,
          ...
        }:
        let
          ext = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        in
        {
          config = lib.mkIf config.programs.firefox.enable {
            programs.firefox.policies.ExtensionSettings.${ext.addonId} = {
              installation_mode = "force_installed";
              install_url = "file://${ext}";
            };
          };
        };
    };
}
