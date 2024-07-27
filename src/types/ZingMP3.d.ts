export type ZingMP3SearchResponse = {
  err: number;
  msg: string;
  data: {
    correctKeyword: string | null; // Maybe string
    items: Array<{
      encodeId: string;
      title: string;
      alias: string;
      isOffical: boolean;
      username: string;
      artistsNames: string;
      artists: Array<{
        id: string;
        name: string;
        link: string;
        spotlight: boolean;
        alias: string;
        thumbnail: string;
        thumbnailM: string;
        isOA: boolean;
        isOABrand: boolean;
        playlistId: string;
      }>;
      isWorldWide: boolean;
      thumbnailM: string;
      link: string;
      thumbnail: string;
      duration: number;
      zingChoice: boolean;
      isPrivate: boolean;
      preRelease: boolean;
      releaseDate: number;
      genreIds: Array<string>;
      distributor: string;
      indicators: []; // Unknown
      radioId?: number;
      isIndie: boolean;
      streamingStatus: number;
      allowAudioAds: boolean;
      hasLyric?: boolean;
      publicStatus: number;
      statusCode: number;
      statusName: string;
      uid: number;
      uname: string;
      canEdit: boolean;
      canDelete: boolean;
      album?: {
        encodeId: string;
        title: string;
        thumbnail: string;
        isoffical: boolean;
        link: string;
        isIndie: boolean;
        releaseDate: string;
        sortDescription: string;
        releasedAt: number;
        genreIds: Array<string>;
        PR: boolean;
        artists: Array<{
          id: string;
          name: string;
          link: string;
          spotlight: boolean;
          alias: string;
          thumbnail: string;
          thumbnailM: string;
          isOA: boolean;
          isOABrand: boolean;
          playlistId: string;
          totalFollow: number;
        }>;
        artistsNames: string;
      };
    }>;
    total: number;
    sectionId: string;
  };
  timestamp: number;
};

export type ZingMP3LyricResponse = {
  err: number;
  msg: string;
  data: {
    sentences: Array<{
      words: Array<{
        startTime: number;
        endTime: number;
        data: string;
      }>;
    }>;
    file: string;
    enabledVideoBG: boolean;
    streamingUrl: string;
    defaultIBGUrls?: Array<string>;
    BGMode: number;
  };
  timestamp: number;
};
