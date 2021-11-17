export interface Area {
    area: string;
    areaname: string;
}

export interface Building {
    buildingid: string;
    building: string;
}

export interface Room {
    room: string;
    roomid: string;
}

export interface Position {
    area: Area;
    building: Building;
    room: Room;
}

export interface QueryElectro {
    positions: number[];
    account: string;
}

export interface CheckPosition extends Position {
    account: string;
}
