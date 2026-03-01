const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'src', 'pages', 'PlateDetailPage.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// 1. Add rakClassicPlateStyling to CarPreview interface
const interfaceTarget = /interface CarPreview {[\s\S]*?plateStyling: CarStyling;/
content = content.replace(interfaceTarget, match => match + '\n    rakClassicPlateStyling?: CarStyling;')

const mobileConfigInterfaceTarget = /mobileConfig\?: {[\s\S]*?plateStyling: CarStyling;/
content = content.replace(mobileConfigInterfaceTarget, match => match + '\n        rakClassicPlateStyling?: CarStyling;')

// 2. Add rakClassicPlateStyling to CAR_PREVIEWS array
// We need to only replace inside CAR_PREVIEWS, not CLASSIC_CAR_PREVIEWS
const carPreviewsStart = content.indexOf('const CAR_PREVIEWS: CarPreview[] = [')
const classicCarPreviewsStart = content.indexOf('const CLASSIC_CAR_PREVIEWS: CarPreview[] = [')

let carPreviewsBlock = content.substring(carPreviewsStart, classicCarPreviewsStart)
const restOfFile = content.substring(classicCarPreviewsStart)

// Regex for the main plateStyling block
// Matches:
//         plateStyling: {
//             top: '...', left: '...', width: '14%', transform: '...',
//             filter: undefined,
//         },
const mainStylingRegex = /(plateStyling:\s*{\s*top:\s*'[^']+',\s*left:\s*'[^']+',\s*width:\s*')([0-9.]+)(%',\s*transform:\s*'[^']+',\s*filter:\s*[^,]+,\s*},)/g

carPreviewsBlock = carPreviewsBlock.replace(mainStylingRegex, (match, p1, width, p3) => {
  const numWidth = parseFloat(width)
  const newWidth = (numWidth * 1.35).toFixed(1).replace(/\.0$/, '')
  const newBlock = `\n        rakClassicPlateStyling: {\n            ${match.split('{')[1].trim()}`
  // Replace width in newBlock
  const adjustedNewBlock = newBlock.replace(`width: '${width}%'`, `width: '${newWidth}%'`)
  return match + adjustedNewBlock
})

// Regex for mobileConfig plateStyling
// Matches:
//             plateStyling: { top: '...', left: '...', width: '20%', transform: '...' },
const mobileStylingRegex = /(plateStyling:\s*{\s*top:\s*'[^']+',\s*left:\s*'[^']+',\s*width:\s*')([0-9.]+)(%',\s*transform:\s*'[^']+'\s*},)/g

carPreviewsBlock = carPreviewsBlock.replace(mobileStylingRegex, (match, p1, width, p3) => {
  const numWidth = parseFloat(width)
  const newWidth = (numWidth * 1.35).toFixed(1).replace(/\.0$/, '')
  const newBlock = `\n            rakClassicPlateStyling: { ${match.split('{')[1].trim()}`
  const adjustedNewBlock = newBlock.replace(`width: '${width}%'`, `width: '${newWidth}%'`)
  return match + adjustedNewBlock
})

content = content.substring(0, carPreviewsStart) + carPreviewsBlock + restOfFile

fs.writeFileSync(filePath, content, 'utf8')
console.log('Successfully updated PlateDetailPage.tsx')
