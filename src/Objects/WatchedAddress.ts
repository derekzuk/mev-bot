class WatchedAddress {
    address: string;
    description: string;
}

function createWatchedAddress(a: string, description: string) {
    var wa = new WatchedAddress();
    wa.address = a;
    wa.description = description;
    return wa;
}

export { WatchedAddress, createWatchedAddress }