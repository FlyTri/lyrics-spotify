export type QQMusicSearchResponse = {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  req: {
    code: number;
    data: {
      body: {
        album: {
          list: [];
        };
        gedantip: {
          tab: number;
          tip: string;
        };
        mv: {
          list: [];
        };
        qc: [];
        singer: {
          list: [];
        };
        song: {
          list: Array<{
            act: number;
            action: {
              alert: number;
              icon2: number;
              icons: number;
              msgdown: number;
              msgfav: number;
              msgid: number;
              msgpay: number;
              msgshare: number;
              switch: number;
              switch2: number;
            };
            album: {
              id: number;
              mid: string;
              name: string;
              pmid: string;
              subtitle: string;
              time_public: string;
              title: string;
            };
            bpm: number;
            content: string;
            desc: string;
            desc_hilight: string;
            docid: string;
            eq: number;
            es: string;
            file: {
              b_30s: number;
              e_30s: number;
              hires_bitdepth: number;
              hires_sample: number;
              media_mid: string;
              size_128mp3: number;
              size_192aac: number;
              size_192ogg: number;
              size_24aac: number;
              size_320mp3: number;
              size_360ra: []; // Unknown
              size_48aac: number;
              size_96aac: number;
              size_96ogg: number;
              size_ape: number;
              size_dolby: number;
              size_dts: number;
              size_flac: number;
              size_hires: number;
              size_new: Array<number>;
              size_try: number;
              try_begin: number;
              try_end: number;
              url: string;
            };
            fnote: number;
            genre: number;
            grp: Array<{
              act: number;
              action: {
                alert: number;
                icon2: number;
                icons: number;
                msgdown: number;
                msgfav: number;
                msgid: number;
                msgpay: number;
                msgshare: number;
                switch: number;
                switch2: number;
              };
              album: {
                id: number;
                mid: string;
                name: string;
                pmid: string;
                subtitle: string;
                time_public: string;
                title: string;
              };
              bpm: number;
              content: string;
              desc: string;
              desc_hilight: string;
              docid: string;
              eq: number;
              es: string;
              file: {
                b_30s: number;
                e_30s: number;
                hires_bitdepth: number;
                hires_sample: number;
                media_mid: string;
                size_128mp3: number;
                size_192aac: number;
                size_192ogg: number;
                size_24aac: number;
                size_320mp3: number;
                size_360ra: []; // Unknown
                size_48aac: number;
                size_96aac: number;
                size_96ogg: number;
                size_ape: number;
                size_dolby: number;
                size_dts: number;
                size_flac: number;
                size_hires: number;
                size_new: Array<number>;
                size_try: number;
                try_begin: number;
                try_end: number;
                url: string;
              };
              fnote: number;
              genre: number;
              grp: []; // Unknown
              hotness: {
                desc: string;
                icon_url: string;
                jump_type: number;
                jump_url: string;
              };
              href3: string;
              id: number;
              index_album: number;
              index_cd: number;
              interval: number;
              isonly: number;
              ksong: {
                id: number;
                mid: string;
              };
              label: string;
              language: number;
              lyric: string;
              lyric_hilight: string;
              mid: string;
              mv: {
                id: number;
                name: string;
                title: string;
                vid: string;
                vt: number;
              };
              name: string;
              newStatus: number;
              ov: number;
              pay: {
                pay_down: number;
                pay_month: number;
                pay_play: number;
                pay_status: number;
                price_album: number;
                price_track: number;
                time_free: number;
              };
              protect: number;
              sa: number;
              singer: Array<{
                id: number;
                mid: string;
                name: string;
                pmid: string;
                title: string;
                type: number;
                uin: number;
              }>;
              status: number;
              subtitle: string;
              tag: number;
              tid: number;
              time_public: string;
              title: string;
              title_hilight: string;
              type: number;
              url: string;
              version: number;
              vf: Array<number>;
              vi: Array<number>;
              volume: {
                gain: number;
                lra: number;
                peak: number;
              };
              vs: Array<string>;
            }>;
            hotness: {
              desc: string;
              icon_url: string;
              jump_type: number;
              jump_url: string;
            };
            href3: string;
            id: number;
            index_album: number;
            index_cd: number;
            interval: number;
            isonly: number;
            ksong: {
              id: number;
              mid: string;
            };
            label: string;
            language: number;
            lyric: string;
            lyric_hilight: string;
            mid: string;
            mv: {
              id: number;
              name: string;
              title: string;
              vid: string;
              vt: number;
            };
            name: string;
            newStatus: number;
            ov: number;
            pay: {
              pay_down: number;
              pay_month: number;
              pay_play: number;
              pay_status: number;
              price_album: number;
              price_track: number;
              time_free: number;
            };
            protect: number;
            sa: number;
            singer: Array<{
              id: number;
              mid: string;
              name: string;
              pmid: string;
              title: string;
              type: number;
              uin: number;
            }>;
            status: number;
            subtitle: string;
            tag: number;
            tid: number;
            time_public: string;
            title: string;
            title_hilight: string;
            type: number;
            url: string;
            version: number;
            vf: Array<number>;
            vi: Array<number>;
            volume: {
              gain: number;
              lra: number;
              peak: number;
            };
            vs: Array<string>;
          }>;
        };
        songlist: {
          list: [];
        };
        user: {
          list: [];
        };
        zhida: {
          list: [];
        };
      };
      code: number;
      feedbackURL: string;
      meta: {
        cid: string;
        curpage: number;
        dir: string;
        display_order: []; // Unknown
        ein: number;
        estimate_sum: number;
        expid: string;
        is_filter: number;
        next_page_start: object;
        nextpage: number;
        perpage: number;
        query: string;
        report_info: {
          items: object;
        };
        result_trustworthy: number;
        ret: number;
        safetyType: number;
        safetyUrl: string;
        searchid: string;
        sid: string;
        sin: number;
        step_rela_syntax_tree: object;
        sum: number;
        tab_list: Array<number>;
        uid: string;
        v: number;
      };
      ver: number;
    };
  };
};

export type QQMusicLyricsResponse = {
  code: number;
  ts: number;
  start_ts: number;
  traceid: string;
  "music.musichallSong.PlayLyricInfo.GetPlayLyricInfo": {
    code: number;
    data: {
      songID: number;
      songName: string;
      songType: number;
      singerName: string;
      qrc: number;
      crypt: number;
      lyric: string;
      trans: string;
      roma: string;
      lrc_t: number;
      qrc_t: number;
      trans_t: number;
      roma_t: number;
      lyric_style: number;
      classical: number;
      introduceTitle: string;
      introduceText: Array<{
        title: string;
        content: string;
      }>;
      vecSongID: null; // Unknown
      track: {
        id: number;
        type: number;
        mid: string;
        name: string;
        title: string;
        subtitle: string;
        singer: null; // Unknown
        album: {
          id: number;
          mid: string;
          name: string;
          title: string;
          subtitle: string;
          time_public: string;
          pmid: string;
        };
        mv: {
          id: number;
          vid: string;
          name: string;
          title: string;
          vt: number;
        };
        interval: number;
        isonly: number;
        language: number;
        genre: number;
        index_cd: number;
        index_album: number;
        time_public: string;
        status: number;
        fnote: number;
        file: {
          media_mid: string;
          size_24aac: number;
          size_48aac: number;
          size_96aac: number;
          size_192ogg: number;
          size_192aac: number;
          size_128mp3: number;
          size_320mp3: number;
          size_ape: number;
          size_flac: number;
          size_dts: number;
          size_try: number;
          try_begin: number;
          try_end: number;
          url: string;
          size_hires: number;
          hires_sample: number;
          hires_bitdepth: number;
          b_30s: number;
          e_30s: number;
          size_96ogg: number;
          size_360ra: null; // Unknown
          size_dolby: number;
          size_new: null; // Unknown
        };
        pay: {
          pay_month: number;
          price_track: number;
          price_album: number;
          pay_play: number;
          pay_down: number;
          pay_status: number;
          time_free: number;
        };
        action: {
          switch: number;
          msgid: number;
          alert: number;
          icons: number;
          msgshare: number;
          msgfav: number;
          msgdown: number;
          msgpay: number;
          switch2: number;
          icon2: number;
        };
        ksong: {
          id: number;
          mid: string;
        };
        volume: {
          gain: number;
          peak: number;
          lra: number;
        };
        label: string;
        url: string;
        bpm: number;
        version: number;
        trace: string;
        data_type: number;
        modify_stamp: number;
        pingpong: string;
        aid: number;
        ppurl: string;
        tid: number;
        ov: number;
        sa: number;
        es: string;
        vs: null; // Unknown
        vi: null; // Unknown
        ktag: string;
        vf: null; // Unknown
      };
      startTs: number;
      transSource: number;
    };
  };
};
