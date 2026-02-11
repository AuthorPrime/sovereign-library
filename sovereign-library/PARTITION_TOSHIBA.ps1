# TOSHIBA Drive Partition Script
# Run this script as Administrator in PowerShell
#
# This will:
# 1. Shrink D: to 256GB (Windows storage)
# 2. Create F: as 256GB NTFS (Additional Windows storage)
# 3. Leave ~170GB unallocated for WSL/Linux use

Write-Host "=== TOSHIBA Drive Partition Script ===" -ForegroundColor Cyan
Write-Host "This will restructure your 750GB TOSHIBA drive (Disk 0)" -ForegroundColor Yellow
Write-Host ""

# Check current state
Write-Host "Current partition layout:" -ForegroundColor Green
Get-Partition -DiskNumber 0 | Format-Table PartitionNumber, DriveLetter, @{N='SizeGB';E={[math]::Round($_.Size/1GB,2)}}, Type

# Get shrink info
Write-Host "`nChecking available shrink space..." -ForegroundColor Green
$partition = Get-Partition -DiskNumber 0 -PartitionNumber 1
$supportedSize = Get-PartitionSupportedSize -DiskNumber 0 -PartitionNumber 1
$minSizeGB = [math]::Round($supportedSize.SizeMin/1GB, 2)
$maxSizeGB = [math]::Round($supportedSize.SizeMax/1GB, 2)
$currentSizeGB = [math]::Round($partition.Size/1GB, 2)

Write-Host "Current D: size: $currentSizeGB GB"
Write-Host "Minimum possible: $minSizeGB GB"
Write-Host "Maximum possible: $maxSizeGB GB"

# Calculate target sizes
$targetDSize = 256GB
$newPartitionSize = 256GB

Write-Host "`n=== PROPOSED CHANGES ===" -ForegroundColor Yellow
Write-Host "D: will be shrunk to: 256 GB (Windows storage)"
Write-Host "New F: partition: 256 GB (NTFS - Additional Windows)"
Write-Host "Unallocated space: ~$([math]::Round(($currentSizeGB - 256 - 256), 0)) GB (for WSL/Linux)"

$confirm = Read-Host "`nProceed with partitioning? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Operation cancelled." -ForegroundColor Red
    exit
}

# Step 1: Shrink D: to 256GB
Write-Host "`nStep 1: Shrinking D: to 256GB..." -ForegroundColor Green
try {
    Resize-Partition -DiskNumber 0 -PartitionNumber 1 -Size $targetDSize
    Write-Host "D: successfully resized to 256GB" -ForegroundColor Green
} catch {
    Write-Host "Error resizing D: - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to defragment D: first or shrink it manually via Disk Management" -ForegroundColor Yellow
    exit
}

# Step 2: Create new NTFS partition (F:)
Write-Host "`nStep 2: Creating new 256GB NTFS partition..." -ForegroundColor Green
try {
    $newPartition = New-Partition -DiskNumber 0 -Size $newPartitionSize -DriveLetter F
    Format-Volume -DriveLetter F -FileSystem NTFS -NewFileSystemLabel "SovereignStorage" -Confirm:$false
    Write-Host "F: (SovereignStorage) created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating new partition - $($_.Exception.Message)" -ForegroundColor Red
}

# Show final state
Write-Host "`n=== FINAL PARTITION LAYOUT ===" -ForegroundColor Cyan
Get-Partition -DiskNumber 0 | Format-Table PartitionNumber, DriveLetter, @{N='SizeGB';E={[math]::Round($_.Size/1GB,2)}}, Type

Write-Host "`nRemaining unallocated space can be used for WSL ext4 partition." -ForegroundColor Yellow
Write-Host "To create WSL partition, use 'wsl --mount' or create ext4 via Linux tools." -ForegroundColor Yellow

Write-Host "`nDone!" -ForegroundColor Green
