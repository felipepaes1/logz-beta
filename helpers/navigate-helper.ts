import { Builder } from "coloquent";

export interface NavigationProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    reset: (params: any) => void;
};

export interface ListParams {
    screen: string;
    baseResource: Builder;
    isDisabled: boolean;
    selectedResource: any;
}

export interface FormPageParams {
    id: any;
}
