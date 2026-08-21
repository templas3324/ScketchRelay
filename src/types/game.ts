export type RoomStatus = "waiting" | "playing" | "revealing" | "finished";
export type GamePhase = "writing" | "drawing";
export type SubmissionKind = "text" | "drawing";
export type RevealMode = "host_controlled" | "automatic";
export type PromptMode = "free" | "random";

export interface GameSettings {
  maxPlayers: number;
  roundSeconds: number;
  revealMode: RevealMode;
  promptMode: PromptMode;
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
    prompt_mode: PromptMode;
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
  hostPlayerId: string;
  players: GamePlayerStatus[];
}

export interface GamePlayerStatus {
  id: string;
  nickname: string;
  status: "online" | "offline" | "left";
}

export interface ChatMessage {
  id: number;
  author_player_id: string | null;
  author_nickname: string;
  content: string;
  created_at: string;
}

export interface ResultSubmission {
  id: string;
  round: number;
  kind: SubmissionKind;
  content: string;
  authorNickname: string;
}

export interface ResultRelay {
  id: string;
  starterNickname: string;
  submissions: ResultSubmission[];
}

export interface ResultsSnapshot {
  roomStatus: RoomStatus;
  revealMode: RevealMode;
  isHost: boolean;
  revealedCount: number;
  totalRelays: number;
  relays: ResultRelay[];
}
