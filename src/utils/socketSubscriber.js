import React from "react"
import fetchers from './fetchers'
import ReactPlayer from 'react-player'

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

function withSocket(Wrapped) {
  return class extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        messages: [],
        chat: [],
        role: "pending"
      }
      this.makeSocket = this.makeSocket.bind(this)
      this.appendToMessages = this.appendToMessages.bind(this)
      this.appendToChat = this.appendToChat.bind(this)
      this.handleVideoEnd = this.handleVideoEnd.bind(this)
      this.handlePresent = this.handlePresent.bind(this)
      this.onDragEnd = this.onDragEnd.bind(this)
      this.goBack = this.goBack.bind(this)
      this.pauseOrPlay = this.pauseOrPlay.bind(this)
      this.goForward = this.goForward.bind(this)
    }

    async componentDidMount() {
      console.log("Mounting...")
      this.makeSocket()
      
      window.addEventListener('beforeunload', () =>{    
        if (this.state.role === "presenter") this.state.socket.send(JSON.stringify({
          intent: "presenter leaving"
        }))
      })

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
          console.log("Checking socket health...")
          if (this.state.socket.readyState !== WebSocket.OPEN && this.state.socket.readyState !== WebSocket.CONNECTING) {
            console.log("Remounting, websocket was ", this.state.socket.readyState)
            this.state.socket.close()
            this.makeSocket()
          }
        }
      })
    }

    makeSocket() {
      let socket = new WebSocket("wss://connect.websocket.in/spec?room_id=queue-" + (window.location.pathname.slice(1) || 1))
      socket.addEventListener('message', message => {
        let parsed = JSON.parse(message.data)
        if (parsed.intent === "look for presenter"
          && this.state.role === "presenter") {
          socket.send(JSON.stringify({
            intent: "presenter exists",
            messages: this.state.messages,
          }))
        }
        else if (parsed.intent === "look for presenter"
          && this.state.role === "no presenter") {
          socket.send(JSON.stringify({
            intent: "no presenter",
            messages: this.state.messages,
          }))
        }
        else if (parsed.intent === "presenter exists") {
          this.setState({
            messages: parsed.messages,
            role: "client"
          })
        }
        else if (parsed.intent === "no presenter") {
          this.setState({
            messages: parsed.messages,
            role: "no presenter"
          })
        }
        else if (parsed.intent === "presenter leaving") {
          this.setState({
            role: "no presenter"
          })
        }
        else if (parsed.intent === "messages changed") {
          this.setState({
            messages: parsed.messages
          })
        }
        else if (parsed.intent === "message added") {
          this.appendToMessages(parsed.message)
        }
        else if (parsed.intent === "chat added") {
          this.appendToChat(parsed.chat)
        }
      })
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({intent: "look for presenter"}))
        this.setState({
          socket
        })
      })
      setTimeout(() => {
        if (this.state.role === "pending") {
          socket.send(JSON.stringify({
            intent: "presenter exists",
            messages: this.state.messages,
          }))
          this.setState({ role: "presenter" })
        }
      }, 3000)
      return socket
    }

    componentWillUnmount() {
      this.state.socket.close()
    }

    async appendToMessages(url) {
      let name = (await fetchers.urlToName(url)) || url
      let time = new Date().getTime() // play the same video twice in a row
      let canBePlayed = ReactPlayer.canPlay(url)
      if (canBePlayed) this.setState(state => {
        return {
          messages: state.messages.concat([{url, name, time}])
        }
      })
    }

    async appendToChat(chat) {
      chat.travelTime = 10 * Math.random() + 10
      this.setState(state => {
        return {
          chat: state.chat.concat([chat])
        }
      }, () => {
        setTimeout(() => {
          this.setState(state => {
            let newChat = state.chat.filter(c => c.time !== chat.time)
            return {
              chat: newChat
            }
          })
        }, chat.travelTime * 1000 * 1.5) // Grace
      })
    }

    handleVideoEnd() {
      this.setState(state => {
        return {
          messages: state.messages.slice(1)
        }
      }, () => {
        this.state.socket.send(JSON.stringify({
          intent: "messages changed",
          messages: this.state.messages
        }))
      })
    }

    handlePresent() {
      this.state.socket.send(JSON.stringify({
        intent: "presenter exists",
        messages: this.state.messages
      }))
      this.setState({
        role: "presenter"
      })
    }

    goBack(e) {
      if (e.detail) e.currentTarget.blur()
      this.state.socket.send(JSON.stringify({
        intent: "go back"
      }))
    }

    pauseOrPlay(e) {
      if (e.detail) e.currentTarget.blur()
      this.state.socket.send(JSON.stringify({
        intent: "pause or play"
      }))
    }

    goForward(e) {
      if (e.detail) e.currentTarget.blur()
      this.state.socket.send(JSON.stringify({
        intent: "go forward"
      }))
    }

    onDragEnd(result) {
      // dropped outside the list
      let messages
      if (!result.destination) {
        messages = Array.from(this.state.messages)
        messages.splice(result.source.index, 1)
      }
      else messages = reorder(
        this.state.messages,
        result.source.index,
        result.destination.index
      );

      this.state.socket.send(JSON.stringify({
        intent: "messages changed",
        messages
      }))

      this.setState({
        messages
      });
    }

    render() {
      return <Wrapped
        messages={this.state.messages}
        chat={this.state.chat}
        role={this.state.role}
        socket={this.state.socket}
        appendToMessages={this.appendToMessages}
        appendToChat={this.appendToChat}
        handleVideoEnd={this.handleVideoEnd}
        handlePresent={this.handlePresent}
        onDragEnd={this.onDragEnd}
        goBack={this.goBack}
        pauseOrPlay={this.pauseOrPlay}
        goForward={this.goForward}
      />
    }
  }
}

export default withSocket