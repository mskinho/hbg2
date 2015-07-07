'use strict';

var should = require('should'),
    request = require('supertest'),
    app = require('../../server'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Member = mongoose.model('Member'),
    agent = request.agent(app);

/**
 * Globals
 */
var credentials, member_credentials, user, user_member, member, member2;

/**
 * Member routes tests
 */
describe('Member CRUD tests', function() {
    beforeEach(function(done) {
        // Create user credentials
        credentials = {
            username: 'username',
            password: 'password'
        };

        member_credentials = {
            username: 'm_username',
            password: 'm_password'
        };

        // Create a new user
        user = new User({
            firstName: 'Full',
            lastName: 'Name',
            displayName: 'Full Name',
            email: 'test@test.com',
            username: credentials.username,
            password: credentials.password,
            provider: 'local',
            roles: ['admin']
        });

        // use as a member without admin role
        user_member = new User({
            firstName: 'Full',
            lastName: 'Name',
            displayName: 'Full Name',
            email: 'test@test.com',
            phone_number: '15002323332',
            username: member_credentials.username,
            password: member_credentials.password,
            provider: 'local',
        });

        // Save a user to the test db and create new Member
        user.save(function(res) {
            member = {
                card_number: 'Member card number',
                phone_number: '15002323332',
                baby_name: 'baby name'
            };
            // member.id = res.id ? res.id : null;
        });
        user_member.save(function() {
            member2 = {
                card_number: 'Member card number2',
                phone_number: '15002323332',
                baby_name: 'baby name'
            };
            done();
        });
    });

    it('should be able to save Member instance if logged in as admin', function(done) {
        agent.post('/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);

                // Save a new Member
                agent.post('/members')
                    .send(member)
                    .expect(200)
                    .end(function(memberSaveErr, memberSaveRes) {
                        // Handle Member save error
                        if (memberSaveErr) done(memberSaveErr);

                        // Get a list of Members
                        agent.get('/members')
                            .end(function(membersGetErr, membersGetRes) {
                                // Handle Member save error
                                if (membersGetErr) done(membersGetErr);

                                // Get Members list
                                var members = membersGetRes.body;

                                // Set assertions
                                (members[0].card_number).should.match('Member card number');

                                // Call the assertion callback
                                done();
                            });
                    });
            });
    });



    it('should not be able to save Member instance if logged in with member role', function(done) {
        agent.post('/auth/signin')
            .send(member_credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);

                agent.post('/members')
                    .send(member2)
                    .expect(403)
                    .end(function(memberSaveErr, memberSaveRes) {
                        // Call the assertion callback
                        done(memberSaveErr);
                    });
            });
    });

    it('should not be able to save Member instance if not logged in', function(done) {
        agent.post('/members')
            .send(member)
            .expect(401)
            .end(function(memberSaveErr, memberSaveRes) {
                // Call the assertion callback
                done(memberSaveErr);
            });
    });

    // TODO: not be able to save Member with card_number already exists in db.
    it('should not be able to save Member instance if no card number is provided', function(done) {
        // Invalidate name field
        member.card_number = '';

        agent.post('/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);

                // Get the userId
                var userId = user.id;

                // Save a new Member
                agent.post('/members')
                    .send(member)
                    .expect(400)
                    .end(function(memberSaveErr, memberSaveRes) {
                        // Set message assertion
                        (memberSaveRes.body.message).should.match('Path `card_number` is required.');

                        // Handle Member save error
                        done(memberSaveErr);
                    });
            });
    });

    it('should be able to update Member instance if signed in as admin', function(done) {
        agent.post('/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);

                // Get the userId
                var userId = user.id;

                // Save a new Member
                agent.post('/members')
                    .send(member)
                    .expect(200)
                    .end(function(memberSaveErr, memberSaveRes) {
                        // Handle Member save error
                        if (memberSaveErr) done(memberSaveErr);

                        // Update Member name
                        member.card_number = '12345678';
                        // Update existing Member
                        agent.put('/members/' + memberSaveRes.body._id)
                            .send(member)
                            .expect(200)
                            .end(function(memberUpdateErr, memberUpdateRes) {
                                // Handle Member update error
                                if (memberUpdateErr) done(memberUpdateErr);

                                // Set assertions
                                (memberUpdateRes.body._id).should.equal(memberSaveRes.body._id);
                                (memberUpdateRes.body.card_number).should.match('12345678');

                                // Call the assertion callback
                                done();
                            });
                    });
            });
    });

    it('should not be able to get a list of Members if not signed in', function(done) {
        request(app)
            .get('/members')
            .expect(401)
            .end(function(memberDeleteErr, memberDeleteRes) {
                // Handle Member error error
                done(memberDeleteErr);
            });
    });

    it('should not be able to get a list of Members if signed in as a member', function(done) {
        agent.post('/auth/signin')
            .send(member_credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);
                agent.get('/members')
                    .expect(403)
                    .end(function(memberListErr, memberListRes) {
                        // Handle Member error error
                        done(memberListErr);
                    });
            });
    });

    it('should be able to get a list of Members if signed in as a admin', function(done) {
        agent.post('/auth/signin')
            .send(credentials)
            .expect(200)
            .end(function(signinErr, signinRes) {
                // Handle signin error
                if (signinErr) done(signinErr);
                agent.get('/members')
                    .expect(200)
                    .end(function(memberListErr, memberListRes) {
                        // Handle Member error error
                        done(memberListErr);
                    });
            });
    });



    it('should not be able to get  Member instance if not signed in ', function(done) {
        var memberObj = new Member(member);

        memberObj.save(function() {
            // try get the member without signed in
            agent.get('/members/' + memberObj._id)
                .expect(401)
                .end(function(getErr, getRes) {
                    done(getErr);
                });
        });

    });


    it('should not be able to get  Member instance if signed in without admin role', function(done) {
        var memberObj = new Member(member);

        memberObj.save(function() {
            // sign in as a member without admin role.
            agent.post('/auth/signin')
                .send(member_credentials)
                .expect(200)
                .end(function(signinErr, signinRes) {
                    // Handle signin error
                    if (signinErr) done(signinErr);

                    // try to get the a member instance.
                    agent.get('/members/' + memberObj._id)
                        .expect(403)
                        .end(function(getErr, getRes) {
                            done(getErr);
                        });
                });
        });

    });

    it('should be able to get a Member instance if signed as admin', function(done) {
        var memberObj = new Member(member);

        memberObj.save(function() {
            // sign in as a member without admin role.
            agent.post('/auth/signin')
                .send(credentials)
                .expect(200)
                .end(function(signinErr, signinRes) {
                    // Handle signin error
                    if (signinErr) done(signinErr);

                    // try to get the a member instance.
                    agent.get('/members/' + memberObj._id)
                        .expect(200)
                        .end(function(getErr, getRes) {
                            done(getErr);
                        });
                });
        });

    });


    it('should not be able to delete the Member instance if not signed in.', function(done) {
        // Create new Member model instance
        var memberObj = new Member(member);

        // Save the Member
        memberObj.save(function() {
            // Try deleting Member

            agent.delete('/members/' + memberObj._id)
                .expect(401)
                .end(function(memberDeleteErr, memberDeleteRes) {
                    // Handle Member error error
                    done(memberDeleteErr);
                });
        });
    });

    it('should not be able to delete the Member instance if signed in without admin role', function(done) {
        // Create new Member model instance
        var memberObj = new Member(member);

        // Save the Member
        memberObj.save(function() {
            // Try deleting Member
            agent.post('/auth/signin')
                .send(member_credentials)
                .expect(200)
                .end(function(signinErr, signinRes) {
                    // Handle signin error
                    if (signinErr) done(signinErr);
                    agent.delete('/members/' + memberObj._id)
                        .expect(403)
                        .end(function(memberDeleteErr, memberDeleteRes) { // Set message assertion
                            done(memberDeleteErr);
                        });
                });
        });
    });

    it('should be able to delete the Member instance if signed in with admin role', function(done) {
        // Create new Member model instance
        var memberObj = new Member(member);

        // Save the Member
        memberObj.save(function() {
            // Try deleting Member
            agent.post('/auth/signin')
                .send(credentials)
                .expect(200)
                .end(function(signinErr, signinRes) {
                    // Handle signin error
                    if (signinErr) done(signinErr);
                    agent.delete('/members/' + memberObj._id)
                        .expect(200)
                        .end(function(memberDeleteErr, memberDeleteRes) { // Set message assertion
                            done(memberDeleteErr);
                        });
                });
        });

    });

    afterEach(function(done) {
        User.remove().exec();
        Member.remove().exec();
        done();
    });
});
