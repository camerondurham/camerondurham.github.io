{ pkgs ? import <nixpkgs> {} }:

# https://nixos.wiki/wiki/Development_environment_with_nix-shell
pkgs.mkShell {
  buildInputs = [
    pkgs.zola

    # pkgs.act TODO: re-enable act when I can figure out how to make it work
  ];

  shellHook = ''
    echo Starting blog shell...
    # make sure to pull in latest change from themes...
    git submodule update --init --recursive
    alias g="git"
    zola serve
  '';

  # Add environment variables here, e.g.:
  # AWS_DEFAULT_REGION = "us-west-2";
}

