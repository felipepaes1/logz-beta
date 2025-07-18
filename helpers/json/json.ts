export function isValidJsonString(element: string): boolean {
    try {
        JSON.parse(element);

        return true;
    } catch (err) {
        return false;
    }
}
