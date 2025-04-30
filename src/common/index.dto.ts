import type { TreeDataProvider, ExtensionContext } from 'vscode';

export interface CustomDescriptor<T> {
    configurable?: boolean;
    enumerable?: boolean;
    value?: T;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

export interface IRegisterCommandItem {
    handler: (context: ExtensionContext, ...args: any[]) => void;
    options?: any;
}

export type CommandHandlerDescriptor = CustomDescriptor<IRegisterCommandItem['handler']>;

export interface IRegisterTreeDataProviderItem<T> {
    provider: TreeDataProvider<T>;
    options?: any;
}

export type TreeDataProviderDescriptor<T> = CustomDescriptor<IRegisterTreeDataProviderItem<T>['provider']>;