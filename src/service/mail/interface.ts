import { PositionState } from "../../model/position";
import { UserModelState } from "../../model/user";

export interface ElectroUrgentState {
    findTime: string;
    electro: number;
    position: PositionState;
    user: UserModelState;
}
