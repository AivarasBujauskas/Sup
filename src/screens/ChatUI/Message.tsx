import React, {Component} from 'react';
import {StyleSheet, View, TouchableWithoutFeedback, Clipboard} from 'react-native';
import ReactDOM from 'react-dom';
import {connect, DispatchProp} from 'react-redux';
import Electron from 'electron';
// import {ContextMenu, MenuItem} from 'react-contextmenu';

import {isSameUser} from './utils';
import {RootState} from '../../reducers';
import Bubble from './Bubble';
import Avatar from '../../components/Avatar';
import px from '../../utils/normalizePixel';
import withTheme, {ThemeInjectedProps} from '../../contexts/theme/withTheme';
import {NavigationInjectedProps, withNavigation} from 'react-navigation';
import Day from './Day';
import {meSelector} from '../../reducers/teams';
import rem from '../../utils/stylesheet/rem';
import Reactions from './Reactions';
import {goToThread} from '../../actions/chats/thunks';
import showMenu from '../../utils/showMenu';
import isNative from '../../utils/isNative';
import {Platform} from '../../utils/platform';
import WithMenu, {MenuInjectedProps} from '../../contexts/menu/with-menu';
import MenuItem from '../../components/Menu/MenuItem';

type Props = ReturnType<typeof mapStateToProps> &
  MenuInjectedProps &
  NavigationInjectedProps &
  ThemeInjectedProps &
  DispatchProp<any> & {
    messageId: string;
    prevMessageId: string;
    nextMessageId: string;
    inverted: boolean;
    showDivider?: boolean;
    hideAvatar?: boolean;
    hideReplies?: boolean;
  };

class Message extends Component<Props> {
  messageContainerRef: any;

  componentDidMount() {
    Platform.isWeb &&
      ReactDOM.findDOMNode(this.messageContainerRef)?.addEventListener(
        'contextmenu',
        this.handleContextMenuWeb,
      );
  }

  componentWillUnmount() {
    Platform.isWeb &&
      ReactDOM.findDOMNode(this.messageContainerRef)?.removeEventListener(
        'contextmenu',
        this.handleContextMenuWeb,
      );
  }

  goToReplies = () => {
    this.props.dispatch(goToThread(this.props.messageId, this.props.navigation));
  };

  copyTextToClipboard = () => {
    const {currentMessage} = this.props;
    if (Platform.isElectron) {
      Electron.clipboard.writeText(currentMessage.text);
    } else {
      Clipboard.setString(currentMessage.text);
    }
  };

  handleContextMenuWeb = (e: MouseEvent) => {
    e.preventDefault();

    const items = (
      <>
        <MenuItem onPress={this.goToReplies} title="Reply" />
        <MenuItem onPress={this.copyTextToClipboard} title="Copy text" />
      </>
    );
    // alert(JSON.stringify({x: e.pageX, y: e.pageY}));
    this.props.show && this.props.show({x: e.pageX, y: e.pageY}, items);

    // if (Platform.isElectron) {
    //   const {Menu, MenuItem} = Electron.remote;

    //   const menu = new Menu();

    //   if (!this.props.currentThreadId)
    //     menu.append(
    //       new MenuItem({
    //         label: 'Reply',
    //         click: this.goToReplies,
    //       }),
    //     );

    //   // menu.append(new MenuItem({type: 'separator'}));
    //   menu.append(new MenuItem({label: 'Copy text', click: this.copyTextToClipboard}));

    //   menu.popup({window: Electron.remote.getCurrentWindow()});
    // }

    return false;
  };

  openMessageContextNative = () => {
    if (!isNative()) return;

    const menu = [];

    if (!this.props.currentThreadId)
      menu.push({
        title: 'Reply',
        onPress: this.goToReplies,
      });

    menu.push({
      title: 'Copy',
      onPress: this.copyTextToClipboard,
    });
    showMenu(menu, this);
  };

  renderAvatar(isMe, sameUser) {
    let {hideAvatar} = this.props;
    if (hideAvatar) return null;
    // If same author of previous message, render a placeholder instead of avatar
    if (sameUser)
      return (
        <View
          style={{width: 35, height: 35, marginLeft: isMe ? 7.5 : 0, marginRight: isMe ? 0 : 7.5}}
        />
      );
    return <Avatar userId={this.props.currentMessage.user} width={px(35)} />;
  }

  renderBubble(isMe: boolean, sameUser: boolean) {
    return (
      <Bubble
        messageId={this.props.messageId}
        userId={this.props.currentMessage.user}
        pending={this.props.currentMessage.pending}
        isMe={isMe}
        sameUser={sameUser}
        hideReplies={this.props.hideReplies}
        hideAvatar={this.props.hideAvatar}
      />
    );
  }

  renderAnchor(isMe, sameUser) {
    if (sameUser) return null;
    let {theme, currentMessage} = this.props;
    return (
      <View
        style={[
          {
            width: 0,
            height: 0,
            borderTopWidth: 7.5,
            borderTopColor: 'transparent',
            borderBottomColor: isMe ? 'purple' : theme.backgroundColor,
            borderRightWidth: isMe ? 7.5 : 0,
            borderLeftWidth: isMe ? 0 : 7.5,
            borderBottomWidth: 7.5,
            borderRightColor: 'transparent',
            borderLeftColor: 'transparent',
            borderTopLeftRadius: isMe ? 7.5 : 0,
            borderTopRightRadius: isMe ? 0 : 7.5,
          },
          currentMessage.pending && {
            opacity: 0.5,
          },
        ]}
      />
    );
  }

  renderDay() {
    let {currentMessage, prevMessage} = this.props;
    return <Day currentMessage={currentMessage} prevMessage={prevMessage} />;
  }

  renderDivder() {
    if (!this.props.showDivider) return null;
    return (
      <View
        style={{
          width: rem(150),
          marginBottom: px(10),
          height: StyleSheet.hairlineWidth,
          backgroundColor: this.props.theme.backgroundColorLess4,
          alignSelf: 'center',
        }}
      />
    );
  }

  renderReactions() {
    return <Reactions messageId={this.props.messageId} hideAvatar={this.props.hideAvatar} />;
  }

  // renderMenu = () => {
  //   return (
  //     <ContextMenu id={this.props.currentMessage.ts}>
  //       <MenuItem data={{foo: 'bar'}} onClick={this.goToReplies}>
  //         Reply
  //       </MenuItem>
  //       <MenuItem data={{foo: 'bar'}} onClick={this.copyTextToClipboard}>
  //         Copy {this.props.currentMessage.text}
  //       </MenuItem>
  //       {/* <MenuItem divider />
  //     <MenuItem data={{foo: 'bar'}} onClick={this.handleClick}>
  //       ContextMenu Item 3
  //     </MenuItem> */}
  //     </ContextMenu>
  //   );
  // };

  render() {
    let {currentMessage, prevMessage, nextMessage, me, inverted} = this.props;
    let sameUser = isSameUser(currentMessage, nextMessage);
    let isMe = me && me.id === currentMessage.user;
    const hasReactions = !!currentMessage.reactions?.length;
    return (
      <>
        {!inverted && this.renderDay()}
        {inverted && this.renderReactions()}

        <TouchableWithoutFeedback
          onLongPress={this.openMessageContextNative}
          disabled={Platform.isElectron}>
          <View
            ref={ref => (this.messageContainerRef = ref)}
            style={[
              styles.container,
              isMe ? styles.right : styles.left,
              {marginBottom: sameUser && !hasReactions ? 4 : 10},
            ]}>
            {!isMe ? (
              <>
                {this.renderAvatar(isMe, sameUser)}
                {this.renderAnchor(isMe, sameUser)}
              </>
            ) : null}
            {this.renderBubble(isMe, sameUser)}
            {isMe && (
              <>
                {this.renderAnchor(isMe, sameUser)}
                {this.renderAvatar(isMe, sameUser)}
              </>
            )}
          </View>
        </TouchableWithoutFeedback>

        {!inverted && this.renderReactions()}
        {this.renderDivder()}
        {inverted && this.renderDay()}
        {/* {this.renderMenu()} */}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  left: {
    justifyContent: 'flex-start',
    marginLeft: 8,
    marginRight: 0,
  },
  right: {
    justifyContent: 'flex-end',
    marginLeft: 0,
    marginRight: 8,
  },
});

const mapStateToProps = (state: RootState, ownProps) => ({
  currentMessage: state.entities.messages.byId[ownProps.messageId],
  prevMessage: state.entities.messages.byId[ownProps.prevMessageId],
  nextMessage: state.entities.messages.byId[ownProps.nextMessageId],
  me: meSelector(state),
  currentThreadId: state.chats.currentThreadId,
});

export default connect(mapStateToProps)(withTheme(withNavigation(WithMenu(Message))));
