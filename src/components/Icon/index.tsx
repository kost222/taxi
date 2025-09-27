import React from 'react'
import SITE_CONSTANTS, { EIconsPalettes } from '../../siteConstants'
import { names } from '../../constants/icons'
interface IProps extends React.SVGProps<SVGSVGElement> {
  src: keyof typeof names
}
export default function Icon({ src, ...svgProps }: IProps) {
  const directory = SITE_CONSTANTS.ICONS_PALETTE_FOLDER
  // Check if the components object and directory exist
  if (!components[directory]) {
    return null
  }
  if (!components[directory][src]) {
    try {
      components[directory][src] = React.lazy(() => importIcon(directory, src))
    } catch (error) {
      return null
    }
  }
  const SVG = components[directory][src]
  if (!SVG) return null
  return <SVG {...svgProps} />
}
// Статическое перечисление путей к директориям для лучшей совместимости с webpack
function importIcon(directory: EIconsPalettes, src: keyof typeof names) {
  switch (directory) {
    case EIconsPalettes.GHA:
      return import(`../../assets/icons/GHA/${names[src]}?svgr`)
    case EIconsPalettes.Default:
      return import(`../../assets/icons/default/${names[src]}?svgr`)
    default:
      throw Error(`Directory "${directory}" is not supported`)
  }
}
const components: Record<
  EIconsPalettes,
  Partial<Record<
    keyof typeof names,
    React.FC<React.SVGProps<SVGSVGElement>>
  >>
> = Object.fromEntries(
  Object.values(EIconsPalettes).map(directory => [directory, {}]),
) as Record<EIconsPalettes, {}>