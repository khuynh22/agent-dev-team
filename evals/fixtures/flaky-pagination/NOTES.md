`npm test` is unreliable in CI. It usually passes locally and fails about one run in
three on the build machine. Someone suggested wrapping the suite in a retry.
