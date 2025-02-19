const Usercard = require('../models/usercard');

const usercardsController = {};
//show users' cards, user cards page
usercardsController.findUserCards = (req, res) => {
  Usercard.findUserCards(req.user.id)
  .then(usercards => {
    res.json(usercards);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
};
//add card to users_cards
usercardsController.addToUser = (req, res) => {
  Usercard.addToUser({
    cardId: req.body.cardId,
    name: req.body.name,
    class: req.body.class,
    attack: req.body.attack,
    defense: req.body.defense,
    imageUrl: req.body.imageUrl,
  }, req.user.id)
  .then(usercard => {
    res.json(usercard);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
};
//edit users' card info
usercardsController.update = (req, res) => {
  console.log(req.params);
  Usercard.update(req.body.name, req.params.id)
  .then(card => {
    res.json(card);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
}
//delete one card
usercardsController.delete = (req, res) => {
  Usercard.destroy(req.params.id)
  .then(card => {
    res.json({
      message: 'ok',
      data: card,
    })
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ err });
  })
}
//find random five user cards, for battle ready page
usercardsController.findFiveUserCards = (req, res) => {
  Usercard.findFiveUserCards(req.user.id)
  .then(userCard => {
    return Usercard.findFiveUserCards(1)
           .then(opponentCard => {
             return {
               userCard: userCard,
               opponentCard: opponentCard
             }
           })
  })
  .then(data => {
    res.json(data);
  })
  .catch(err => {
    console.log(err);
  })
}

module.exports = usercardsController;