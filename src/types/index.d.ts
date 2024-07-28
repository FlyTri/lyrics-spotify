import { sources } from "../structures/SourceManager";

declare global {
  export type SpotifyTrackData = {
    id: string;
    name: string;
    duration: number;
    album: string;
    artists: string;
  };

  export type Sources = typeof sources;

  export type Metadata = {
    key: string;
    value: string;
  };

  export type Interlude = {
    time: number;
    wait: true;
    new?: true;
  };

  export type LineSynced = {
    text: string;
    time: number;
  };

  export type TextSynced = {
    text: string;
    time: number;
    new?: true;
    lineEnd?: number;
  };

  export type NotSynced = { text: string };

  export type LRC = {
    type: "LINE_SYNCED";
    metadata: Metadata[];
    lyrics: (LineSynced | Interlude)[];
  };

  export type QRC = {
    type: "TEXT_SYNCED";
    metadata: Metadata[];
    lyrics: (TextSynced | Interlude)[];
  };

  export type Plain = {
    type: "NOT_SYNCED";
    metadata: [];
    lyrics: NotSynced[];
  };
}

export type TextSyncedData = {
  type: "TEXT_SYNCED";
  data: (TextSynced | Interlude)[];
  source: string;
};

export type LineSyncedData = {
  type: "LINE_SYNCED";
  data: (LineSynced | Interlude)[];
  source: string;
};

export type NotSyncedData = {
  type: "NOT_SYNCED";
  data: NotSynced[];
  source: string;
};

export type Lyrics =
  | TextSyncedData
  | LineSyncedData
  | NotSyncedData
  | { message: string }
  | { type: "INSTRUMENTAL" | "DJ" };
