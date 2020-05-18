'use strict'
const {google} = require('googleapis')
// const YOUTUBE_PK='AIzaSyDthANcEwY313X8P27E1SE_CHvq3M_f0CE' //ngxtri@gmail.com
// const YOUTUBE_PK='AIzaSyD4aB9qEEHdmkYe5rX5INjU3UxkawaiUyo' //someids@gmail.com
// const YOUTUBE_PK='AIzaSyCw_FAt-qYU7r-uSGZ9Rg-SMgz6LpOsY2w' //brian3t0512
const YOUTUBE_PK='AIzaSyCtldbHl9WoT5Eu9dv_svGmpbpnXxOeP7Q' //brian3t0513

class Google {
  /**
   * Get the first youtube link, based on query string
   * Returns: {url: url, thumbnail: the_highest_quality_thumbnail}
   * @returns {Promise<{thumbnail: null, vid_id: string}>}
   */
  static async yt_find_first_vid(query){
    const youtube = google.youtube({
      version: 'v3',
      auth: YOUTUBE_PK
    });

    const params = {
      q: query,
      type: 'video',
      maxResults: 1,
      part: 'snippet'
    };

// get the blog details
    let res = await youtube.search.list(params)

    if (!res) {
      return null
    }
    let first_vid = res.data.items
    if (!first_vid){ return null }
    first_vid=first_vid.pop()
    if (!first_vid || !first_vid.id || !first_vid.id.videoId) return null
    let vid_id = first_vid.id.videoId
    if (!vid_id){ return null }
    let thumbnail = null
    if (first_vid.snippet && first_vid.snippet.thumbnails && first_vid.snippet.thumbnails.high){
      thumbnail = first_vid.snippet.thumbnails.high.url
    }
    return {vid_id: vid_id, thumbnail: thumbnail}


  }
}

module.exports = Google
