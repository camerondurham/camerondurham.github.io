{
  description = "An overengineered and unnecessary flake for my blog";

  nixConfig.bash-prompt = "[nix(cams-blog)] ";
  inputs = { nixpkgs.url = "github:nixos/nixpkgs/22.11"; };

  outputs = { self, nixpkgs }:
    let
      darwinPkgs = nixpkgs.legacyPackages.x86_64-darwin.pkgs;
      m1DarwinPkgs = nixpkgs.legacyPackages.aarch64-darwin.pkgs;
      linuxPkgs = nixpkgs.legacyPackages.x86_64-linux.pkgs;
      # fooScript = pkgs.writeScriptBin "foo.sh" ''
      #   #!/bin/sh
      #   echo $FOO
      # '';
    in
    {
      # Run these with:
      # nix develop
      devShells.x86_64-darwin.default = darwinPkgs.mkShell {
        name = "Zola Build Environment on Intel Macs";
        buildInputs = [
          darwinPkgs.zola
          darwinPkgs.nixpkgs-fmt
          darwinPkgs.nodePackages_latest.markdownlint-cli2
        ];
      };
      # TODO: figure out a better way to handle this
      devShells.aarch64-darwin.default = m1DarwinPkgs.mkShell {
        name = "Zola Build Environment on Apple Silicon";
        buildInputs = [
          m1DarwinPkgs.zola
          m1DarwinPkgs.nixpkgs-fmt
          m1DarwinPkgs.nodePackages_latest.markdownlint-cli2
        ];
      };
      devShells.x86_64-linux.default = linuxPkgs.mkShell {
        name = "Zola Build Environment on Linux";
        buildInputs = [
          linuxPkgs.zola
          linuxPkgs.nixpkgs-fmt
          linuxPkgs.nodePackages_latest.markdownlint-cli2
        ];
      };
    };
}
