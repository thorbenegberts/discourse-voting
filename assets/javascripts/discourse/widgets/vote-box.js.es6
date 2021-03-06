import { createWidget } from 'discourse/widgets/widget';
import { ajax } from 'discourse/lib/ajax';
import RawHtml from 'discourse/widgets/raw-html';

export default createWidget('vote-box', {
  tagName: 'div.voting-wrapper',
  buildKey: () => 'vote-box',

  buildClasses() {
    if (Discourse.SiteSettings.voting_show_who_voted) { return 'show-pointer'; }
  },

  defaultState() {
    return { allowClick: true, initialVote: false };
  },

  html(attrs, state){
    var voteCount = this.attach('vote-count', attrs);
    var voteButton = this.attach('vote-button', attrs);
    var voteOptions = this.attach('vote-options', attrs);
    let contents = [voteCount, voteButton, voteOptions];

    if (state.votesAlert > 0) {
      const html = "<div class='voting-popup-menu vote-options popup-menu'>" + I18n.t("voting.votes_left", {
          count: state.votesAlert,
          path: this.currentUser.get("path") + "/activity/votes"
      }) + "</div>";
      contents.push(new RawHtml({html}));
    }

    return contents;

  },

  hideVotesAlert() {
    if (this.state.votesAlert) {
      this.state.votesAlert = null;
      this.scheduleRerender();
    }
  },

  click() {
    this.hideVotesAlert();
  },

  clickOutside(){
    this.hideVotesAlert();
  },

  addVote(){
    var topic = this.attrs;
    var state = this.state;
    return ajax("/voting/vote", {
      type: 'POST',
      data: {
        topic_id: topic.id
      }
    }).then((result) => {
      topic.set('vote_count', result.vote_count);
      topic.set('user_voted', true);
      let currentUser = Discourse.User.current();
      currentUser.set('votes_exceeded', !result.can_vote);
      if (result.alert) {
        state.votesAlert = result.votes_left;
        this.scheduleRerender();
      }
      topic.set('who_voted', result.who_voted);
      state.allowClick = true;
    }).catch(function(error) {
      console.log(error);
    });
  },

  removeVote(){
    var topic = this.attrs;
    var state = this.state;
    return ajax("/voting/unvote", {
      type: 'POST',
      data: {
        topic_id: topic.id
      }
    }).then(function(result) {
      topic.set('vote_count', result.vote_count);
      topic.set('user_voted', false);
      Discourse.User.current().set('votes_exceeded', !result.can_vote);
      topic.set('who_voted', result.who_voted);
      state.allowClick = true;
    }).catch(function(error) {
      console.log(error);
    });
  }

});
