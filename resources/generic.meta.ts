import { AttachmentResource } from "./Attachment/attachment.resource";
import { MonthEnum } from "./general.enum";

export const months = [
    {number: 1, abbreviation: 'Jan'},
    {number: 2, abbreviation: 'Fev'},
    {number: 3, abbreviation: 'Mar'},
    {number: 4, abbreviation: 'Abr'},
    {number: 5, abbreviation: 'Mai'},
    {number: 6, abbreviation: 'Jun'},
    {number: 7, abbreviation: 'Jul'},
    {number: 8, abbreviation: 'Ago'},
    {number: 9, abbreviation: 'Set'},
    {number: 10, abbreviation: 'Out'},
    {number: 11, abbreviation: 'Nov'},
    {number: 12, abbreviation: 'Dez'}
];

export interface GenericMetaItem {
    name: string;
    value: any;
    helpText?: any;
    icon?: any;
    index?: number;
    bgColor?: string;
    textColor?: string;
    extra?: any;
}

export interface MonthAttachmentsInterface {
    month: MonthEnum;
    attachment_resources: Array<AttachmentResource>;
}

export interface GenericGeoLocationInterface {
    latitude: number;
    longitude: number;
}
