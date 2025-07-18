import { BaseResource } from './BaseResource';

export abstract class BaseDTO {
    public static fromManyResources(resources: BaseResource[] | BaseResource): any[] {
        const data = removeEmptyValues(Array.isArray(resources) ? resources : [resources]);

        return data?.map((resource) => this.fromResource(resource)) || [];
    }

    public clone() {
        return this.cloneProperties(this);
    }

    private cloneProperties(instanceToClone: any) {
        let clone = Object.create(instanceToClone);

        for (let propertyName in instanceToClone) {
            if (propertyName) {
                let property = instanceToClone[propertyName];

                if (property instanceof BaseDTO) {
                    clone[propertyName] = property.clone();
                } else if (property instanceof BaseResource) {
                    clone[propertyName] = property.clone();
                } else if (Array.isArray(property)) {
                    let clonedArray: any[] = [];

                    property.forEach((element) => {
                        if (element instanceof Object) {
                            clonedArray.push(this.cloneProperties(element));
                        } else {
                            clonedArray.push(element);
                        }
                    });

                    clone[propertyName] = clonedArray;
                } else {
                    clone[propertyName] = property;
                }
            }
        }

        return clone;
    }
}
