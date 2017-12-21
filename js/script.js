var esEndpoint = 'https://search-group6-activity-website-gv3gkyysjd5b7hnkji7hcmghzi.us-east-1.es.amazonaws.com/activities_test/activity/';
var apiGateWay = 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/activity/';

/******************** helper function ********************/

function createNode(type, classes) {
  var node = document.createElement(type);
  classes.forEach(function(c) {
    node.classList.add(c);
  });
  return node;
}

/******************** helper function ********************/


function loadActId() {
  if ($("#attendance")) {
    $('#attendance').attr('href', 'activity_attendance.html?q=' + localStorage.getItem('hangout_actid'))
  }
  if ($("#detail")) {
    $('#detail').attr('href', 'activity_detail.html?q=' + localStorage.getItem('hangout_actid'))
  }
}

function joinAct(act_id) {
  var info = {
    username: localStorage.getItem('hangout_account'),
    token: localStorage.getItem('hangout_accesstoken'),
    act_id: act_id,
  }
  $.ajax({
        url: 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/join',
        type: 'post',
        dataType: 'json',
        contentType: "application/json",
        headers: {'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('hangout_idtoken'),
                },
        data: JSON.stringify(info),
        success: function (data) {
            console.log(data);
            if (data.Error) {
              alert(data.Error);
            }
            else {
              alert('Join success!');
            }
        },
    })
}

function getUser() {
  var accessToken = localStorage.getItem('hangout_accesstoken');
  var idToken = localStorage.getItem('hangout_idtoken');
  var refreshToken = localStorage.getItem('hangout_refreshtoken');
  var account = localStorage.getItem('hangout_account');
  console.log('Account:' + account);
  if (account == null) {
    location.href = 'login.html';
  }
  $('#show-username').html('<span class="fa fa-user"></span>' + account);
}

function logout() {
  localStorage.removeItem('hangout_accesstoken');
  localStorage.removeItem('hangout_idtoken');
  localStorage.removeItem('hangout_refreshtoken');
  localStorage.removeItem('hangout_account');
  location.href = 'login.html';
}

function fillInfo() {
  var info = {
    token: localStorage.getItem('hangout_accesstoken'),
  }
  $.ajax({
        url: 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/profile',
        type: 'put',
        dataType: 'json',
        contentType: "application/json",
        headers: {'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('hangout_idtoken'),
                },
        data: JSON.stringify(info),
        success: function (data) {
            //alert(data.msg);
            console.log(data.id);
            console.log(data.phone);
            console.log(data.age);
            console.log(data.gender);
            console.log(data.nickname);
            if (data.phone) {
              $("input[name='phone']").val(data.phone);
            }
            if (data.age) {
              $("input[name='age']").val(data.age);
            }
            if (data.nickname) {
              $("input[name='nickname']").val(data.nickname);
            }
            if (data.gender == 'male') {
              $("input[id='male']").attr('checked', true);
              $("input[id='female']").attr('checked', false);
            }
            else {
              $("input[id='male']").attr('checked', false);
              $("input[id='female']").attr('checked', true);
            }
            $("input[name='sex']").val(data.gender);
        },
    });
}

function getActivities() {
  console.log(composeQuery());
  fetch(esEndpoint + '_search?size=100' + composeQuery(), {
    headers: { 'Content-Type': 'application/json' },
    method: 'GET'
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log(data.hits.hits);
      renderAllActivities(data.hits.hits);
      return false;
    })
    .catch(function (error) {
      console.log(error);
  });
}


function getActivityById(id, next) {
  fetch(esEndpoint + id, {
    headers: { 'Content-Type': 'application/json' },
    method: 'GET'
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log(data._source);
      next(data._source);
    })
    .catch(function (error) {
      console.log(error);
  });
}

function renderAllActivities(activities) {
  var frame = document.getElementById('activities-frame');
  while (frame.hasChildNodes()) {
    frame.removeChild(frame.lastChild);
  }
  activities.forEach(function(activity) {
    frame.appendChild(renderActivity(activity));
  });
}

function renderActivity(activity) {
  var node = createNode('div', ['card', 'text-center']);
  node.innerHTML = `
<img class="activity-img card-img-top" src="${activity._source.picture}">
<div class="card-block activity-info">
  <a href="activity_detail.html?q=${activity._id}">
    <h4 class="card-title activity-name">${activity._source.name}</h4>
  </a>
  <p class="card-text activity-explanation">${activity._source.explanation}</p>
  <button class="btn btn-danger" onclick="deleteActivity('${activity._id}')">Delete</button>
  <button class="btn btn-success" onclick="joinAct('${activity._id}')">Join</button>
  <p></p>
</div>

<div class="card-footer text-muted">
  <i class="fa fa-map-pin" aria-hidden="true"></i> ${activity._source.place}
  <small class="text-muted">${activity._source.start_date}</small>
</div>
  `;
  return node;
}

function deleteActivity(activityId) {
  fetch(esEndpoint + activityId, { method: "DELETE" })
    .then(function (res) {
      console.log(res);
      alert(res.statusText);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function postActivity() {
  var form = document.getElementById('new_activity');
  var activities = composeNewActivity(form.elements);
  console.log(activities);
  fetch(apiGateWay, {
    headers: {
      'Content-Type': 'application/json',
	    'Authorization': localStorage.getItem("hangout_idtoken")},
      'method': "POST",
      'body': JSON.stringify(activities)
    })
    .then(function (res) {
      console.log(res);
      alert(res.statusText);
      return res.json();
    }).then(function(data){
      if (data._id) {
        location.href = 'activity_detail.html?q=' + data._id;
      }
    }).catch(function (error) {
      console.log(error);
    });
}

function composeNewActivity(elements) {
  var obj ={};
  for(var i = 0; i < elements.length ; ++i){
      var item = elements.item(i);
      if (item.name !== '' && item.value !== '') {
        obj[item.name] = item.value;
      }
  }
  return obj;
}

function composeQuery() {
  var form = document.getElementById('search-form');
  var type = form.elements.type.value;
  var kw = form.elements.kw.value;
  var ret = '';
  ret += kw === ''? '' : '(' + kw + ')';
  if (type !== '0') {
    ret += (ret.length > 0 ? 'AND' : '') + '(type:' + type + ')';
  }
  return ret.length > 0? '&q=' + ret : ret;
}

function getMyAttActs() {
    var info = {
        id: localStorage.getItem('hangout_id'),
        username: localStorage.getItem('hangout_account'),
        token: localStorage.getItem('hangout_accesstoken'),
    }
    $.ajax({
        url: 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/attend',
        type: 'get',
        //dataType: 'json',
        contentType: "application/json",
        headers: {
                'Authorization': localStorage.getItem('hangout_idtoken'),
                },
        //data: JSON.stringify(info),
        success: function (data) {
            console.log(data);
            renderMyActs(data.activities);
        },
    })
}

function getMyCrtActs() {
    var info = {
        id: localStorage.getItem('hangout_id'),
        username: localStorage.getItem('hangout_account'),
        token: localStorage.getItem('hangout_accesstoken'),
    }
    $.ajax({
        url: 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/launch',
        type: 'get',
        contentType: "application/json",
        headers: {
                'Authorization': localStorage.getItem('hangout_idtoken'),
                },
        success: function (data) {
            console.log(data);
            renderMyActs(data.activities);
        },
    })
}

function renderMyActs(acts) {
    var frame = document.getElementById('activities-frame');
    acts.forEach(function(act) {
        frame.appendChild(renderMyAct(act));
    });
}

function renderMyAct(act) {
    var node = createNode('div', ['col-lg-10', 'my-att-act']);
    var divNode = createNode('div', []);
    node.appendChild(divNode);

    var actLinkNode = createNode('a', ['col-lg-10', 'list-group-item', 'active']);
    actLinkNode.setAttribute('href', 'activity_detail.html?q=' + act.id);
    var actNameNode = createNode('h4', ['list-group-item-heading']);
    actNameNode.innerHTML = act.name;
    var actTimeNode = createNode('h5', ['list-group-item-heading']);
    actTimeNode.innerHTML = act.start_date + ' ' + act.start_time;
    actLinkNode.appendChild(actNameNode);
    actLinkNode.appendChild(actTimeNode);
    divNode.appendChild(actLinkNode);

    var actDescriptionNode = createNode('div', ['col-lg-10', 'list-group-item']);
    actDescriptionNode.innerHTML = "<h4 class='list-group-item-heading'> <span class='glyphicon glyphicon-map-marker' aria-hidden:true></span>" + act.place + "</h4><p class='list-group-item-text'>" + act.explanation + "</p>"
    divNode.appendChild(actDescriptionNode);

    var buttonNode = createNode('div', []);
    if (act.status == "already_in") {
        buttonNode.innerHTML = '<button type="submit" class="btn btn-md pull-right disabled" style="position:relative;top:4px">Joined</button>';
    }
    else if (act.status == "expired") {
        buttonNode.innerHTML = '<button type="submit" class="btn btn-md pull-right disabled" style="position:relative;top:4px">Expired</button>';
    }
    else if (act.status == "available") {
        buttonNode.innerHTML = '<form role="form" method="post" action=""><input type="hidden" name="activity_id" value={{activity.id}} /><input type="hidden" name="form_type" value="apply_activity" /><button type="submit" class="btn btn-md btn-danger pull-right" style="position:relative;top:4px">Apply</button></form>';
    }
    divNode.appendChild(buttonNode);

    return node;
}

/******************** login form ********************/
$('.form').find('input, textarea').on('keyup blur focus', function (e) {

  var $this = $(this),
      label = $this.prev('label');

    if (e.type === 'keyup') {
      if ($this.val() === '') {
          label.removeClass('active highlight');
        } else {
          label.addClass('active highlight');
        }
    } else if (e.type === 'blur') {
      if( $this.val() === '' ) {
        label.removeClass('active highlight');
      } else {
        label.removeClass('highlight');
      }
    } else if (e.type === 'focus') {

      if( $this.val() === '' ) {
        label.removeClass('highlight');
      }
      else if( $this.val() !== '' ) {
        label.addClass('highlight');
      }
    }

});

$('.tab a').on('click', function (e) {

  e.preventDefault();

  $(this).parent().addClass('active');
  $(this).parent().siblings().removeClass('active');

  target = $(this).attr('href');

  $('.tab-content > div').not(target).hide();

  $(target).fadeIn(600);

});
/******************** login form ********************/
