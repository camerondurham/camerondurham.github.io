{
  description = "An overengineered and unnecessary flake for my blog";

  nixConfig.bash-prompt = "[nix(cams-blog)] ";
  inputs = { nixpkgs.url = "github:nixos/nixpkgs/23.11"; };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [
        "x86_64-darwin"
        "aarch64-darwin"
        "x86_64-linux"
      ];

      # Helper function to get packages for a specific system
      forSystem = system: let pkgs = nixpkgs.legacyPackages.${system}; in
        {
          default = pkgs.mkShell {
            name = "Zola Build Environment";
            buildInputs = with pkgs; [
              zola
              nixpkgs-fmt
              nodePackages_latest.markdownlint-cli2
            ];
          };
        };
    in
    {
      devShells = nixpkgs.lib.genAttrs supportedSystems forSystem;
    };
}
