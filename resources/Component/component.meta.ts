import { ComponentTypeEnum } from "./component.enum";

export const componentTypeOptions: Array<any> = [
    {value: ComponentTypeEnum.OUT, name: 'Saída'},
    {value: ComponentTypeEnum.IN, name: 'Entrada'},
];

export const standardComponentTypeOption: any = componentTypeOptions[0];
