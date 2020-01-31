const rp = require('request-promise');
const cheerio = require('cheerio');

const go = async (url) => {
  const options = {
    uri: url,
    transform: function (body) {
      return cheerio.load(body);
    }
  }

  try {
    const $ = await rp(options);

    function ObjectLength(object) {
      var length = 0;
      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          ++length;
        }
      }
      return length;
    };

    // setting date for capture date field
    const dateCapture = new Date();
    var dateOptions = {
      year: "numeric",
      month: "2-digit",
      day: "numeric"
    };

    // variables for scraping data
    const seriesProduction = 'AMC';

    let title = '';
    title = $('div[class=title]').text() !== '' ? $('div[class=title]').text() :
      ($('h1[itemprop=name]').text() !== '' ? $('h1[itemprop=name]').text() : $('meta[property="og:title"]')[0].attribs.content);


    const seriesData = $('script')[1].childNodes[0].data;
    const seriesHelper = seriesData.split('= ');
    const jsonParse = JSON.parse(seriesHelper[1]);

    const episodeHelper = jsonParse.modules.match.params.episode.split('-');
    const seriesEpisodeNo = parseInt(episodeHelper[1].trim());
    const seriesSeasonNo = parseInt(jsonParse.modules.match.params.season.trim());

    const seriesUrl = 'https://www.amc.com/shows/' + jsonParse.modules.match.params.show.trim();

    const episodeMeta = jsonParse.modules.byId;

    const obLength = ObjectLength(episodeMeta);
    let currentEpisodePartialMeta = {}, sourceId = '', contentRating = '', seriesSourceId = '', seasonSourceId = '',
      offerType = '', runtime = '', seriesTitle = '';

    if (episodeMeta.hasOwnProperty('episode')) {
      switch (obLength) {
        case 6:
          currentEpisodePartialMeta = episodeMeta.episode_feed_3;
          break;
        case 7:
          currentEpisodePartialMeta = episodeMeta.episode_feed_4;
          break;
        case 8:
          currentEpisodePartialMeta = episodeMeta.episode_feed_5;
          break;
        case 9:
          currentEpisodePartialMeta = episodeMeta.episode_feed_6;
          break;
        case 10:
          currentEpisodePartialMeta = episodeMeta.episode_feed_7;
          break;

        default:
          currentEpisodePartialMeta = episodeMeta.episode_feed_2;
          break;
      }
      if (currentEpisodePartialMeta.hasOwnProperty('posts')) {
        const sID_step1 = seriesData.split('"amcn_field_video_pid":"');
        if (sID_step1.length > 1) {
          const sID_step2 = sID_step1[1].split('","');
          sourceId = sID_step2[0];
        } else {
          sourceId = 'N/A';
        }
        contentRating = currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_video_tv_content_rating;
        seriesSourceId = parseInt(currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_relation_show_id);
        seasonSourceId = parseInt(currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_relation_season_id);
        offerType = currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_video_category === 'TVE-Unauth' ? 'FREE' : 'TVE';
        runtime = parseInt(currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_video_end_credits_start) || '';
        seriesTitle = currentEpisodePartialMeta.posts[0].attached.meta.amcn_field_relation_show_display;
      } else {
        const sID_step1 = seriesData.split('"amcn_field_video_pid":"');
        const serSID_step1 = seriesData.split('"amcn_field_relation_show_id":"');
        const serSID_step2 = serSID_step1[serSID_step1.length - 1].split('","');
        const seaSID_step1 = seriesData.split('"amcn_field_relation_season_id":"');
        const seaSID_step2 = seaSID_step1[seaSID_step1.length - 1].split('","');

        if (sID_step1.length > 1) {
          const sID_step2 = sID_step1[1].split('","');
          sourceId = sID_step2[0];

          const extraJSONURL = `https://link.theplatform.com/s/M_UwQC/media/${sourceId}?format=preview`;
          const extraData = await rp(extraJSONURL);
          const jsonDATA = JSON.parse(extraData);

          if (jsonDATA.ratings.length > 0) {
            contentRating = jsonDATA.ratings[0].rating;
          }
          seriesSourceId = parseInt(serSID_step2[0]);
          seasonSourceId = parseInt(seaSID_step2[0]);
          offerType = jsonDATA.amc$videoCategory === 'TVE-Unauth' ? 'FREE' : 'TVE';
          runtime = Math.trunc(parseInt(jsonDATA.duration) / 1000) || '';
          seriesTitle = jsonDATA.amc$show;
        } else {
          sourceId = 'N/A';
        }
      }
    } else {
      const sID_step1 = seriesData.split('"amcn_field_video_pid":"');
      const sID_step2 = sID_step1[1].split('","');
      const serSID_step1 = seriesData.split('"amcn_field_relation_show_id":"');
      const serSID_step2 = serSID_step1[serSID_step1.length - 1].split('","');
      const seaSID_step1 = seriesData.split('"amcn_field_relation_season_id":"');
      const seaSID_step2 = seaSID_step1[seaSID_step1.length - 1].split('","');

      sourceId = sID_step2[0];

      const extraJSONURL = `https://link.theplatform.com/s/M_UwQC/media/${sourceId}?format=preview`;
      const extraData = await rp(extraJSONURL);
      const jsonDATA = JSON.parse(extraData);

      if (jsonDATA.ratings.length > 0) {
        contentRating = jsonDATA.ratings[0].rating;
      }
      seriesSourceId = parseInt(serSID_step2[0]);
      seasonSourceId = parseInt(seaSID_step2[0]);
      offerType = jsonDATA.amc$videoCategory === 'TVE-Unauth' ? 'FREE' : 'TVE';
      runtime = Math.trunc(parseInt(jsonDATA.duration) / 1000) || '';
      seriesTitle = jsonDATA.amc$show;
    }

    // object for each series data
    const seriesList = {
      'bot_system': '',
      'bot_version': '1.0.0',
      'bot_country': 'us',
      'capture_date': '',
      'offer_type': '',
      'purchase_type': '',
      'picture_quality': '',
      'program_price': '',
      'bundle_price': '',
      'currency': '',
      'addon_name': '',
      'is_movie': 0,
      'season_number': '',
      'episode_number': '',
      'title': '',
      'genre': '',
      'source_id': '',
      'program_url': '',
      'maturity_rating': '',
      'release_date': '',
      'viewable_runtime': '',
      'series_title': '',
      'series_source_id': '',
      'series_url': '',
      'series_genre': '',
      'season_source_id': ''
    };

    // assign data for object series
    seriesList.bot_system = seriesProduction;
    seriesList.capture_date = dateCapture.toLocaleString('en', dateOptions);
    seriesList.offer_type = offerType;
    seriesList.season_number = seriesSeasonNo;
    seriesList.episode_number = seriesEpisodeNo;
    seriesList.title = title;
    seriesList.source_id = sourceId;
    seriesList.program_url = url;
    seriesList.maturity_rating = contentRating;
    seriesList.viewable_runtime = runtime;
    seriesList.series_title = seriesTitle;
    seriesList.series_source_id = seriesSourceId;
    seriesList.series_url = seriesUrl;
    seriesList.season_source_id = seasonSourceId;

    return seriesList;
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  start: go
};