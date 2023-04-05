{ pkgs ? import <nixpkgs> {} }:

# https://nixos.wiki/wiki/Development_environment_with_nix-shell
pkgs.mkShell {
  buildInputs = [
    pkgs.zola
  ];

  shellHook = ''
    echo Starting blog shell...
    # make sure to pull in latest chnage from themes...
    git submodule update --init --recursive
  '';

  # Add environment variables here, e.g.:
  # AWS_DEFAULT_REGION = "us-west-2";
}

