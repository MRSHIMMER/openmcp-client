import { CommandHandlerDescriptor, IRegisterCommandItem, IRegisterTreeDataProviderItem, TreeDataProviderDescriptor } from "./index.dto";

export const registerCommands = new Map<string, IRegisterCommandItem>();
export const registerTreeDataProviders = new Map<string, IRegisterTreeDataProviderItem<any>>();

export function RegisterCommand(command: string, options?: any) {
    return function(target: any, propertyKey: string, descriptor: CommandHandlerDescriptor) {
        const handler = descriptor.value;
        
        // 根据 option 进行的操作
        // ...

        if (handler) {
            registerCommands.set(command, { handler, options });
        }

        return descriptor;
    }
}

export function RegisterTreeDataProvider<T>(command: string, options?: any) {
    return function(target: any, propertyKey: string, descriptor: TreeDataProviderDescriptor<T>) {
        const provider = descriptor.value;

        // 根据 option 进行的操作
        // ...

        if (provider) {
            registerTreeDataProviders.set(command, { provider, options });
        }
        
        return descriptor;
    }
}