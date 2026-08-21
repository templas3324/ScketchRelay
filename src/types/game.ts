export type RoomStatus = "waiting" | "playing" | "revealing" | "finished";
export type GamePhase = "writing" | "drawing";
export type SubmissionKind = "text" | "drawing";

export interface GameSettings {
  maxPlayers: number;
  roundSeconds: number;
}

export interface Player {
  id: string;
  nickname: string;
  isConnected: boolean;
  joinedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  players: Player[];
  settings: GameSettings;
  createdAt: string;
}

export interface Game {
  id: string;
  roomCode: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  deadline: string | null;
}

export interface Submission {
  id: string;
  relayId: string;
  authorId: string;
  kind: SubmissionKind;
  content: string;
  createdAt: string;
}

export interface Relay {
  id: string;
  gameId: string;
  starterId: string;
  submissions: Submission[];
}
