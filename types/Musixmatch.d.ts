export type MusixmatchLyricsResponse = {
  message: {
    header: {
      status_code: number;
      execute_time: number;
      pid: number;
      surrogate_key_list: []; // Unknown
    };
    body: {
      macro_calls: {
        "track.lyrics.get": {
          message: {
            header: {
              status_code: number;
              execute_time: number;
            };
            body: {
              lyrics: {
                lyrics_id: number;
                can_edit: number;
                check_validation_overridable: number;
                locked: number;
                published_status: number;
                action_requested: string;
                verified: number;
                restricted: number;
                instrumental: number;
                explicit: number;
                lyrics_body: string;
                lyrics_language: string;
                lyrics_language_description: string;
                script_tracking_url: string;
                pixel_tracking_url: string;
                html_tracking_url: string;
                lyrics_copyright: string;
                writer_list: []; // Unknown
                publisher_list: []; // Unknown
                backlink_url: string;
                updated_time: string;
              };
            };
          };
        };
        "track.snippet.get": {
          message: {
            header: {
              status_code: number;
              execute_time: number;
            };
            body: {
              snippet: {
                snippet_id: number;
                snippet_language: string;
                restricted: number;
                instrumental: number;
                snippet_body: string;
                script_tracking_url: string;
                pixel_tracking_url: string;
                html_tracking_url: string;
                updated_time: string;
              };
            };
          };
        };
        "track.subtitles.get": {
          message: {
            header: {
              status_code: number;
              available: number;
              execute_time: number;
              instrumental: number;
            };
            body: {
              subtitle_list: Array<{
                subtitle: {
                  subtitle_id: number;
                  restricted: number;
                  published_status: number;
                  subtitle_body: string;
                  subtitle_avg_count: number;
                  lyrics_copyright: string;
                  subtitle_length: number;
                  subtitle_language: string;
                  subtitle_language_description: string;
                  script_tracking_url: string;
                  pixel_tracking_url: string;
                  html_tracking_url: string;
                  writer_list: []; // Unknown
                  publisher_list: []; // Unknown
                  updated_time: string;
                };
              }>;
            };
          };
        };
        "userblob.get": {
          message: {
            header: {
              status_code: number;
            };
          };
          meta: {
            status_code: number;
            last_updated: string;
          };
        };
        "matcher.track.get": {
          message: {
            header: {
              status_code: number;
              execute_time: number;
              confidence: number;
              mode: string;
              cached: number;
            };
            body: {
              track: {
                track_id: number;
                track_mbid: string;
                track_isrc: string;
                commontrack_isrcs: Array<Array<string>>;
                track_spotify_id: string;
                commontrack_spotify_ids: Array<string>;
                commontrack_itunes_ids: Array<number>;
                track_soundcloud_id: number;
                track_xboxmusic_id: string;
                track_name: string;
                track_name_translation_list: Array<{
                  track_name_translation: {
                    language: string;
                    translation: string;
                  };
                }>;
                track_rating: number;
                track_length: number;
                commontrack_id: number;
                instrumental: number;
                explicit: number;
                has_lyrics: number;
                has_lyrics_crowd: number;
                has_subtitles: number;
                has_richsync: number;
                has_track_structure: number;
                num_favourite: number;
                lyrics_id: number;
                subtitle_id: number;
                album_id: number;
                album_name: string;
                album_vanity_id: string;
                artist_id: number;
                artist_mbid: string;
                artist_name: string;
                album_coverart_100x100: string;
                album_coverart_350x350: string;
                album_coverart_500x500: string;
                album_coverart_800x800: string;
                track_share_url: string;
                track_edit_url: string;
                commontrack_vanity_id: string;
                restricted: number;
                first_release_date: string;
                updated_time: string;
                primary_genres: {
                  music_genre_list: Array<{
                    music_genre: {
                      music_genre_id: number;
                      music_genre_parent_id: number;
                      music_genre_name: string;
                      music_genre_name_extended: string;
                      music_genre_vanity: string;
                    };
                  }>;
                };
                secondary_genres: {
                  music_genre_list: Array<{
                    music_genre: {
                      music_genre_id: number;
                      music_genre_parent_id: number;
                      music_genre_name: string;
                      music_genre_name_extended: string;
                      music_genre_vanity: string;
                    };
                  }>;
                };
              };
            };
          };
        };
        "track.richsync.get": {
          message: {
            header: {
              status_code: number;
              available: number;
              execute_time: number;
            };
            body: {
              richsync: {
                richsync_id: number;
                restricted: number;
                richsync_body: string;
                lyrics_copyright: string;
                richsync_length: number;
                richssync_language: string;
                richsync_language_description: string;
                richsync_avg_count: number;
                script_tracking_url: string;
                pixel_tracking_url: string;
                html_tracking_url: string;
                writer_list: []; // Unknown
                publisher_list: []; // Unknown
                updated_time: string;
              };
            };
          };
        };
      };
    };
  };
};
