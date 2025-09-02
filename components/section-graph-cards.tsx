import { ChartBarLabelTopMachines } from "./graficos/chart-bar-label-top-machines"
import { ChartBarLabelTopTools } from "./graficos/chart-bar-label-top-tools"
import { TopColaboradoresCard } from "./top-5-collaborators"

export function SectionGraphCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      
      <TopColaboradoresCard />
      
      <ChartBarLabelTopMachines />
      
      <ChartBarLabelTopTools />
    </div>
  )
}
