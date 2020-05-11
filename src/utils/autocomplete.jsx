import {parse, stringify} from 'flatted/esm'
import LZ from 'lzutf8'

class JSONSet extends Set {
  constructor(args) {
    super(args)
  }

  toJSON() {
    return Array.from(this)
  }
}

class TrieNode {
  constructor(value, parent) {
    this.value = value
    this.parent = parent
    this.children = {}
    this.goals = new JSONSet()
    this.urls = {}
  }
  
  getValue() {
    return this.value
  }

  get(letter) {
    return this.children[letter] || null
  }
  
  getChildren() {
    return this.children
  }

  set(letter, parent) {
    this.children[letter] = new TrieNode(letter, parent)
    return this.children[letter]
  }
  
  addGoal(goal, url) {
    this.goals.add(goal)
    this.urls[goal] = url
  }
  
  getGoals() {
    return this.goals
  }

  getUrls() {
    return this.urls
  }

  static deserialize(obj) {
    let trieNode = new TrieNode()
    trieNode.value = obj.value || null
    trieNode.parent = obj.parent
    for (let key in obj.children) {
      obj.children[key] = TrieNode.deserialize(obj.children[key])
    }
    trieNode.children = obj.children
    trieNode.goals = new JSONSet(obj.goals)
    trieNode.urls = obj.urls
    return trieNode
  }
}

class GoalFactory {
  constructor() {
    this.time = Date.now()
    this.counter = 0
  }
  
  makeGoal(node) {
    if (Date.now() === this.time) this.counter++
    else {
      this.time = Date.now()
      this.counter = 0
    }
    return new Goal(node, this.time + ":" + this.counter)
  }
}

class Goal {
  constructor(node, timestamp) {
    this.node = node
    this.next = null
    this.prev = null
    this.timestamp = timestamp
  }
  
  setNext(next) {
    this.next = next
  }
  
  setPrev(prev) {
    this.prev = prev
  }
  
  getTime() {
    return this.timestamp
  }
  
  getNode() {
    return this.node
  }

  static deserialize(obj) {
    let goal = new Goal()
    goal.node = obj.node || null
    goal.next = obj.next || null
    goal.prev = obj.prev || null
    goal.timestamp = obj.timestamp
    return goal
  }
}

class GoalTimeline {
  constructor() {
    this.queue = []
    this.map = {}
  }
  
  push(goal) {
    this.map[goal.node.getGoals().values().next().value] = goal.timestamp
    if (!this.queue.length) {
      this.queue.push(goal)
    }
    else if (goal.timestamp >= this.queue[this.queue.length - 1].timestamp) {
      this.queue.push(goal)
    }
    this.prune()
  }

  remove() {
    return this.queue.shift()
  }
  
  prune() {
    // while (this.queue.length > 500) {
    //   let node = this.queue[0].node
    //   console.log(node)
    //   let goal = node.getGoals().values().next().value
    //   while (node && this.queue[0].timestamp === this.map[goal]) {
    //     node.getGoals().delete(goal)
    //     delete node.getUrls()[goal]
    //     if (node.getGoals().has(goal)) {
    //       let parent = node.parent
    //       delete parent.getChildren()[node.getValue()]
    //       delete parent.getUrls()[node.getValue()]
    //       node = parent
    //     }
    //     else node = node.parent
    //   }
    //   this.remove()
    // }
  }

  static deserialize(obj) {
    let goalTimeline = new GoalTimeline()
    goalTimeline.queue = obj.queue.map(goal => Goal.deserialize(goal))
    goalTimeline.map = obj.map
    return goalTimeline
  }
}

class Trie {
  constructor() {
    this.head = new TrieNode()
    this.timeline = new GoalTimeline()
    this.goalFactory = new GoalFactory()
  }

  insert(title, url) {
    let lowerCasedTitle = title.toLowerCase()
    let current = this.head
    for (let i = 0; i < lowerCasedTitle.length; i++) {
      //current.addGoal(title, url)
      if (!current.get(lowerCasedTitle[i])) current = current.set(lowerCasedTitle[i], current)
      else current = current.get(lowerCasedTitle[i])
    }
    current.addGoal(title, url)
    let goal = this.goalFactory.makeGoal(current)
    this.timeline.push(goal)
    LZ.compressAsync(stringify(this), {outputEncoding: "StorageBinaryString"}, i => localStorage.setItem('autocomplete', i))
  }
  
  search(prefix) {
    prefix = prefix.toLowerCase()
    let current = this.head
    for (let i = 0; i < prefix.length; i++) {
      if (!current.get(prefix[i])) return {}
      else current = current.get(prefix[i])
    }
    let goalsLimit = 5
    let result = {}
    let frontier = [current]

    while (frontier.length && Object.keys(result).length < goalsLimit) {
      let node = frontier.pop()
      // console.log(frontier, node.children)
      if (node.getGoals().size > 0) {
        let goalsIterator = node.getGoals().values()
        let goal = goalsIterator.next()
        while (!goal.done) {
          result[goal.value] = node.getUrls()[goal.value]
          goal = goalsIterator.next()
        }
      }
      Object.values(node.children).forEach(child => {
        frontier.push(child)
      })
    }
    return result
  }
  
  print() {
    console.log(this.head, this.timeline)
  }

  static deserialize(obj) {
    let trie = new Trie()
    trie.head = TrieNode.deserialize(obj.head)
    trie.timeline = GoalTimeline.deserialize(obj.timeline)
    trie.goalFactory = new GoalFactory()
    return trie
  }
}

export default new (class {
  constructor() {
    this.trie = new Trie()

    if (localStorage.getItem('autocomplete')) {
      let version = parseInt(localStorage.getItem('autocomplete-version') || 0)
      // Convert older tries to newer versions
      // General strategy to to extract all words and reinput them into trie
      if (version === 0) {
        console.log("Migrating older autocomplete data...")
        Object.entries(parse(localStorage.getItem('autocomplete')).head.urls).forEach(([title, url]) => {
          this.trie.insert(title, url)
        })
        localStorage.setItem("autocomplete-version", 2)
      }
      else if (version === 1) {
        console.log("Migrating older autocomplete data...")
        LZ.decompressAsync(
          localStorage.getItem('autocomplete'),
          {inputEncoding: "StorageBinaryString"},
          i => {
            parse(i).timeline.queue.forEach(({node}) => {
              let [title, url] = Object.entries(node.urls)[0]
              this.trie.insert(title, url)
            })
            localStorage.setItem("autocomplete-version", 2)
          }
        )
      }
      else {
        console.log("Using saved autocomplete data!")
        LZ.decompressAsync(
          localStorage.getItem('autocomplete'),
          {inputEncoding: "StorageBinaryString"},
          i => {
            this.trie = Trie.deserialize(parse(i))
          }
        )
      }
    }
    else {
      localStorage.setItem("autocomplete-version", 2)
    }
  }

  search(i) {
    return this.trie.search(i)
  }

  insert(title, url) {
    this.trie.insert(title, url)
  }
})()