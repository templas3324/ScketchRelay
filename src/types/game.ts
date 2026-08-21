export type RoomStatus = "waiting" | "playing" | "revealing" | "finished";
export type GamePhase = "writing" | "drawing";
export type SubmissionKind = "text" | "drawing";
export type RevealMode = "host_controlled" | "automatic";

export interface GameSettings {
  maxPlayers: number;
  roundSeconds: number;
  revealMode: RevealMode;
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

export interface LobbyPlayer {
  id: string;
  nickname: string;
  joined_at: string;
}

export interface RoomSnapshot {
  room: {
    code: string;
    status: RoomStatus;
    host_player_id: string;
    max_players: number;
    round_seconds: number;
    reveal_mode: RevealMode;
    created_at: string;
  };
  players: LobbyPlayer[];
  messages: ChatMessage[];
  currentPlayerId: string;
}

export interface GameSnapshot {
  game: Game;
  currentPlayerId: string;
  submitted: boolean;
  submittedCount: number;
  playerCount: number;
  roomStatus: RoomStatus;
  prompt: Pick<Submission, "kind" | "content"> | null;
}

export interface ChatMessage {
  id: number;
  author_player_id: string | null;
  author_nickname: string;
  content: string;
  created_at: string;
}
