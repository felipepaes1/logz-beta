import { BaseDTO } from "../../base/Base.dto";
import { MachineResource } from "./machine.resource";

export class MachineDto extends BaseDTO {
    public id?: string | number;
    public description!: string;
    public code!: string;
    public model!: string | null;
    public active!: boolean;

    public machineResource!: MachineResource;

    public createFromColoquentResource(resource: MachineResource): MachineDto {

        if (!resource || typeof resource.getApiId !== "function") {
            return this
        }

        this.machineResource = resource;

        this.id = resource.getApiId();
        this.description = resource.getAttribute('description');
        this.code = resource.getAttribute('code');
        this.model = resource.getAttribute('model');
        this.active = !!resource.getAttribute('active');

        return this;
    }

    public bindToSave(): MachineDto {
        return this;
    }
}
