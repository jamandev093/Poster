param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$ProjectRoot = Split-Path $PSScriptRoot -Parent

$taxonomyFolder = Join-Path $ProjectRoot "taxonomy"

$outputFolder = Join-Path $ProjectRoot "src\data\interests"

$jsonFile = Join-Path $taxonomyFolder "$Domain.json"

$outputFile = Join-Path $outputFolder "$Domain.ts"

if (!(Test-Path $jsonFile)) {
    Write-Host ""
    Write-Host "Domain not found:"
    Write-Host $jsonFile
    exit
}

$domain = Get-Content $jsonFile -Raw | ConvertFrom-Json

$builder = New-Object System.Text.StringBuilder

$null = $builder.AppendLine('import { InterestDomain } from "./types";')
$null = $builder.AppendLine()

$null = $builder.AppendLine("export const $($domain.exportName): InterestDomain = {")

$null = $builder.AppendLine("  id: `"$($domain.id)`",")

$null = $builder.AppendLine("  name: `"$($domain.name)`",")

$null = $builder.AppendLine("  icon: `"$($domain.icon)`",")

$null = $builder.AppendLine("  description:")
$null = $builder.AppendLine("    `"$($domain.description)`",")

$null = $builder.AppendLine()

$null = $builder.AppendLine("  categories: [")

foreach($category in $domain.categories){

    $null = $builder.AppendLine()

    $null = $builder.AppendLine("    {")

    $null = $builder.AppendLine("      id: `"$($category.id)`",")

    $null = $builder.AppendLine("      name: `"$($category.name)`",")

    $null = $builder.AppendLine()

    $null = $builder.AppendLine("      subcategories: [")

    foreach($subcategory in $category.subcategories){

        $null = $builder.AppendLine()

        $null = $builder.AppendLine("        {")

        $null = $builder.AppendLine("          id: `"$($subcategory.id)`",")

        $null = $builder.AppendLine("          name: `"$($subcategory.name)`",")

        $null = $builder.AppendLine()

        $null = $builder.AppendLine("          topics: [")

        foreach($topic in $subcategory.topics){

            $null = $builder.AppendLine()

            $null = $builder.AppendLine("            {")

            $null = $builder.AppendLine("              id: `"$($topic.id)`",")

            $null = $builder.AppendLine("              name: `"$($topic.name)`",")

            if($topic.featured){
                $null = $builder.AppendLine("              featured: true,")
            }

            if($topic.searchable -eq $false){
                $null = $builder.AppendLine("              searchable: false,")
            }

            $null = $builder.AppendLine("            },")
        }

        $null = $builder.AppendLine()

        $null = $builder.AppendLine("          ],")

        $null = $builder.AppendLine("        },")
    }

    $null = $builder.AppendLine()

    $null = $builder.AppendLine("      ],")

    $null = $builder.AppendLine("    },")
}

$null = $builder.AppendLine()

$null = $builder.AppendLine("  ],")

$null = $builder.AppendLine()

$null = $builder.AppendLine("};")

$builder.ToString() | Set-Content $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Generated:"
Write-Host $outputFile