import { SchemaProperty } from "./type";

interface TypeAble {
    type: string;
}

export function getDefaultValue(property: TypeAble) {
    if (property.type === 'number' || property.type === 'integer') {
        return 0;
    } else if (property.type === 'boolean') {
        return false;
    } else {
        return '';
    }
}

export function normaliseJavascriptType(type: string) {
    switch (type) {
        case 'integer':
            return 'number';
        case 'number':
            return 'integer';
        case 'boolean':
            return 'boolean';
        case 'string':
            return 'string';
        default:
            return 'string';
    }
}