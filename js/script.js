var esEndpoint = 'https://search-group6-activity-website-gv3gkyysjd5b7hnkji7hcmghzi.us-east-1.es.amazonaws.com/activities_test/activity/';
var apiGateWay = 'https://w217imcezl.execute-api.us-east-1.amazonaws.com/test/';


/******************** helper function ********************/

function createNode(type, classes) {
  var node = document.createElement(type);
  classes.forEach(function(c) {
    node.classList.add(c);
  });
  return node;
}

function recoverRawActivity(activity) {
  return {
    '_id': activity.id,
    '_source': activity
  }
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
        headers: {
          'Content-Type': 'application/json',
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
  $('#show-username').html('<span class="fa fa-user"></span> ' + account);
  $('#show-username').parent().addClass('active');
}

function logout() {
  localStorage.removeItem('hangout_accesstoken');
  localStorage.removeItem('hangout_idtoken');
  localStorage.removeItem('hangout_refreshtoken');
  localStorage.removeItem('hangout_account');
  location.href = 'login.html';
}

function getActivities() {
  console.log(composeQuery());
  fetch(esEndpoint + '_search?size=100' + composeQuery(), {
    headers: { 'Content-Type': 'application/json' },
    method: 'GET'
  }).then(function (res) {
      return res.json();
    }).then(function (data) {
      console.log(data.hits.hits);
      renderAllActivities(data.hits.hits);
      return false;
    }).catch(function (error) {
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

function makeButton(callback, text, style) {
  var node = createNode('button', ['btn', 'btn-' + style]);
  node.textContent = text;
  node.onclick = callback;
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
  <button class="btn btn-success" id="join-${activity._id}-btn" onclick="joinAct('${activity._id}')">Join</button>
  <p></p>
</div>

<div class="card-footer text-muted">
  <i class="fa fa-map-pin" aria-hidden="true"></i> ${activity._source.place}
  <small class="text-muted">${activity._source.start_time}</small>
</div>
  `;
  return node;
}

function deleteActivity(activityId) {
  fetch(esEndpoint + activityId, { method: "DELETE" })
    .then(function (res) {
      console.log(res);
      alert(res.statusText);
      window.location.href = "my_activities.html";
    }).catch(function (error) {
      console.log(error);
    });
}

function postActivity() {
  var form = document.getElementById('new_activity');
  var activities = composeNewActivity(form.elements);
  var reader = new FileReader();
  var file = $("#pic")[0].files[0];
  if (file === undefined) { alert('Please upload a picture.'); }

  reader.onload = function(evt) {
    activities['picture'] = evt.target.result;
    console.log(activities);
    fetch(apiGateWay + 'activity/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem("hangout_idtoken")},
        'method': "POST",
        'body': JSON.stringify(activities)
      }).then(function (res) {
        console.log(res);
        return res.json();
      }).then(function(data){
        if (data.Error) {
          alert(data.Error)
        } else if (data._id) {
          location.href = 'activity_detail.html?q=' + data._id;
        }
      }).catch(function (error) {
        console.log(error);
      });
  }; /* end function(evt)*/
  reader.readAsDataURL(file);
}

function composeNewActivity(elements) {
  var obj ={};
  for(var i = 0; i < elements.length ; ++i){
    var item = elements.item(i);
    if (item.name !== '' && item.value !== '') {
      if (item.name.slice(-5) === '_time') {
        obj[item.name] = item.value.replace('T', ', ');
      } else {
        obj[item.name] = item.value;
      }
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

function getMyActivities(role) {
  fetch(apiGateWay + role, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem("hangout_idtoken")},
      'method': "GET",
    }).then(function(res){
      console.log(res);
      return res.json();
    }).then(function(data) {
      console.log(data);
      renderAllActivities(data.activities.map(recoverRawActivity));
    }).catch(function(error) {
      console.log(error);
    });
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

function tabClick(e) {

  e.preventDefault();

  $(this).parent().addClass('active');
  $(this).parent().siblings().removeClass('active');

  target = $(this).attr('href');

  $('.tab-content > div').not(target).hide();

  $(target).fadeIn(600);

}


$('.tab a').on('click', tabClick);
/******************** login form ********************/
