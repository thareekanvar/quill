import {
  Database,
  FileText,
  Folder,
  Package,
  SquaresFour,
  Archive,
  Circle,
  type Icon,
} from "@phosphor-icons/react"

const iconMap: Record<string, Icon> = {
  Database,
  FileText,
  Folder,
  Package,
  SquaresFour,
  Archive,
  Circle,
  // Backward compatibility mappings for old icon names
  Table: Database,
  TableRows: Database,
  Stack: Database,
  StackSimple: Database,
  GridFour: SquaresFour,
  Grid: SquaresFour,
  GridNine: SquaresFour,
  List: Database,
  ListBullets: Database,
  Cards: SquaresFour,
  Box: Package,
  Cube: Package,
  Cylinder: Package,
}

export function getIconComponent(iconName?: string): Icon {
  if (!iconName) return Database
  return iconMap[iconName] || Database
}

export function IconComponent({ 
  iconName, 
  className 
}: { 
  iconName?: string
  className?: string 
}) {
  const Icon = getIconComponent(iconName)
  return <Icon className={className} />
}

