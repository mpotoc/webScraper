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

    // setting date for capture date field
    const dateCapture = new Date();
    var dateOptions = {
      year: "numeric",
      month: "2-digit",
      day: "numeric"
    };

    // variables for scraping data
    const seriesProduction = 'AMC';

    const movieData = $('script')[1].childNodes[0].data;

    const sID_step1 = movieData.split('"amcn_field_video_pid":"');
    const sID_step2 = sID_step1[1].split('","');
    const rating_step1 = movieData.split('"amcn_field_video_tv_content_rating":"');
    const rating_step2 = rating_step1[1].split('"}');

    const sourceId = sID_step2[0];
    const contentRating = rating_step2[0];

    const extraJSONURL = `https://link.theplatform.com/s/M_UwQC/media/${sourceId}?format=preview`;
    const extraData = await rp(extraJSONURL);
    const jsonDATA = JSON.parse(extraData);

    // movie object
    const movieList = {
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
      'is_movie': 1,
      'season_number': 0,
      'episode_number': 0,
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
    movieList.bot_system = seriesProduction;
    movieList.capture_date = dateCapture.toLocaleString('en', dateOptions);
    movieList.offer_type = jsonDATA.amc$videoCategory === 'Movies-Auth' ? 'TVE' : 'FREE';
    movieList.title = jsonDATA.title;
    movieList.genre = jsonDATA.amc$genre;
    movieList.source_id = sourceId;
    movieList.program_url = url;
    movieList.maturity_rating = contentRating;
    movieList.viewable_runtime = jsonDATA.duration;

    return movieList;
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  start: go
};