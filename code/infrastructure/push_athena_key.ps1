# PowerShell script to push Athena's SSH key to all three nodes
# You will be prompted for each password

$nodes = @(
    @{ Host = '192.168.1.237'; User = 'author_prime'; Name = 'APOLLO (LOQ)' },
    @{ Host = '192.168.1.21'; User = 'hub'; Name = 'HERMES (Pi Ubuntu)' },
    @{ Host = '192.168.1.127'; User = 'node'; Name = 'MNEMOSYNE (Pi OS)' }
)

$key = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"

foreach ($node in $nodes) {
    Write-Host "\nPushing key to $($node.Name) [$($node.User)@$($node.Host)]..."
    $command = "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    $key | ssh "$($node.User)@$($node.Host)" $command
    Write-Host "Done with $($node.Name)."
}

Write-Host "\nAll keys pushed. You can now test passwordless SSH access."
