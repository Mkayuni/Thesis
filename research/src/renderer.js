$(document).ready(function () {
  // QUESTION SETUP

  let lis = [];
  let questionMarkdown;

  let firstLoad = true;

  let schema = new Map();
  let attributes = new Map();

  let relationships = new Map();
  let relCount = 0;

  const cardinalities = ['', '0..1', '0..*', '1..1', '1..*'];

  // new added
  let cardinalityOptions_text = "_";

  function questionSetup() {
    //Getting the elements from markdown, setting opening submenus on click

    lis = document.getElementById('question').getElementsByTagName('li');
    for (let i = 0; i < lis.length; i++) {
      divs = lis[i].children;
      for (let j = 0; j < divs.length; j++) {
        divs[j].className = 'dropdown ' + i;
        let val = divs[j].innerHTML;
        let valER = divs[j].getAttribute('nameer');
        let btnHTML =
          '<button type="button" onclick="openMenu(this)" class="dropbtn ' +
          i +
          '" id="m-' +
          i +
          '-' +
          j +
          '" nameer="' +
          valER +
          '">' +
          val +
          '</button>' +
          '<div id="' +
          i +
          '-' +
          j +
          '" nameer="' +
          valER +
          '" class="dropdown-content">';
        btnHTML += '<div class="submenu ' + valER + '" id="sm-entity-' + i + '-' + j + '"></div>';
        btnHTML +=
          '<div class="submenu" id="sm-att-' +
          i +
          '-' +
          j +
          '"><a class="disabled-link attribute ' +
          i +
          '-' +
          j +
          '">Add attribute </a></div>';
        btnHTML += '</div>';

        divs[j].innerHTML = btnHTML;
        updateEntityMenu(i, j, false);
      }
    }
    // DATA STRUCTURES SETUP
    schema = new Map();
    attributes = new Map();

    relationships = new Map();
    relCount = 0;
    update();
  }

  function setFirstLoad(l) {
    firstLoad = l;
  }

  function setOldAnswer(old_answer) {
    old_answer = old_answer.trim('\n');
    if (old_answer != '') {
      let ans = old_answer.split('\n');
      for (let i = 0; i < ans.length; i++) {
        let answer = ans[i];
        let ind = answer.indexOf('-');
        if (ind < 0) {
          parseEntity(answer);
        } else {
          parseRelationship(answer);
        }
      }
    }
  }

  function parseEntity(line) {
    let attributes = [];
    line = line.trim();
    line = line.substring(1, line.length - 1);
    split_line = line.split('|');
    entity_name = split_line[0];
    if (!schema.has(entity_name)) {
      schema.set(entity_name, { entity: entity_name, attribute: new Map(), i: -1, j: -1 });
    }
    let allEntities1 = Array.from(document.getElementsByClassName(entity_name));
    let allEntities2 = Array.from(
      document.getElementsByClassName(entity_name[0].toLowerCase() + entity_name.substring(1))
    );
    let allEntities = [].concat(allEntities1, allEntities2);
    for (let i = 0; i < allEntities.length; i++) {
      if (allEntities[i].className.indexOf(' disabled-link') < 0) {
        allEntities[i].className = allEntities[i].className + ' disabled-link';
      }
    }
    showAddAttribute();
    update();
    if (split_line.length > 1) {
      att = split_line[1].split(';');
      for (let i = 0; i < att.length; i++) {
        let key = '';
        if (att[i].indexOf('{PK}') != -1) {
          let att_ = att[i].trim();
          att_ = att_.substring(0, att_.indexOf('{PK}'));
          key = '{PK}';
          attributes[i] = att_.trim();
        } else if (att[i].indexOf('{PPK}') != -1) {
          let att_ = att[i].trim();
          att_ = att_.substring(0, att_.indexOf('{PPK}'));
          key = '{PPK}';
          attributes[i] = att_.trim();
        } else {
          attributes[i] = att[i];
        }
        addAttribute(entity_name, attributes[i], key);
      }
    }
  }

  function parseRelationship(line) {
    let indexL = line.indexOf('[');
    let indexR = line.indexOf(']');
    let relationA = line.substring(indexL + 1, indexR);
    let indexL2 = line.indexOf('[', indexL + 1);
    let indexR2 = line.indexOf(']', indexR + 1);
    let relationB = line.substring(indexL2 + 1, indexR2);
    card = line.substring(indexR + 1, indexL2);
    cardinal = card.split('-');
    cardinal[0] = cardinal[0].trim();
    cardinal[1] = cardinal[1].trim();
    let cardinalText = line.indexOf(":");
    let cardinality_Text="";
    cardinality_Text = line.substring(cardinalText + 1);
    if (cardinality_Text.includes("undefined"))
     cardinality_Text=cardinality_Text.replaceAll('undefined', '_____');
    addRelationship(relationA, relationB, cardinal[0], cardinal[1],cardinality_Text);
  }

  window.setQuestionMarkdown = function (q) {
    questionMarkdown = q;
    let question = document.getElementById('question');
    // changing the question from markdown to HTML code
    question.innerHTML = markdownToHTML(questionMarkdown);
    questionSetup();

    if (oldAnswer != {} && oldAnswer != null) {
      setOldAnswer(oldAnswer);
    }
  };

  window.setQuestionMarkdown = function (q) {
    questionMarkdown = q;
    let question = document.getElementById('question');
    // changing the question from markdown to HTML code
    question.innerHTML = markdownToHTML(questionMarkdown);
    questionSetup();

    if (oldAnswer != {} && oldAnswer != null) {
      setOldAnswer(oldAnswer);
    }
  };

  //Open dropdown menus
  window.openMenu = function (val) {
    closeMenus();
    document.getElementById(val.id.slice(2)).classList.toggle('show');
  };

  //Close dropdown menus
  function closeMenus() {
    let dropdowns = document.getElementsByClassName('dropdown-content');
    for (let i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i].classList.contains('show')) dropdowns[i].classList.remove('show');
    }
  }

  //If clicked outside dropdown menu, close dropdown menu
  window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) closeMenus();
  };

  //INTERFACE SETUP
  let addModal = document.getElementById('addModal');
  let editModal = document.getElementById('editModal');
  let attModal = document.getElementById('attributeModal');
  let markDetailsModal = document.getElementById('markDetailsModal');
  let helpModal = document.getElementById('helpModal');
  let umlModal = document.getElementById('umlModal');

  //Navigation bar
  let manageRelBtn = document.getElementById('manageRelBtn');
  let manageEntBtn = document.getElementById('manageEntBtn');
  let manageSmRelBtn = document.getElementById('manageSmRelBtn');
  let manageSmEntBtn = document.getElementById('manageSmEntBtn');

  //SAVE ANSWER AS TEXT FILE & MARK DISPLAY SETUP
  let saveBtn = document.getElementById('saveBtn');
  let helpBtn = document.getElementById('helpBtn');
  let continueBtn = document.getElementById('continueBtn');
  let markDisplay = document.getElementById('markDisplay');
  let studentInfo = document.getElementById('studentInfo');
  let umlDisplay = document.getElementById('displayBtn');
  let copyBtn = document.getElementById('copyBtn');
  let studentAnswerBox = document.getElementById('textb');
  let umlDisplayText = document.getElementById('umlText');

  markDisplay.style.display = 'none';
  continueBtn.style.display = 'none';
  studentInfo.style.display = 'none';

  continueBtn.onclick = function () {
    saveBtn.style.display = 'inline';
    markDisplay.style.display = 'none';
    continueBtn.style.display = 'none';
    studentInfo.style.display = 'none';
    enableQuestionEditing();
  };

  helpBtn.onclick = function () {
    helpModal.style.display = 'block';
  };

  umlDisplay.onclick = function () {
    umlModal.style.display = 'block';
  };

  copyBtn.onclick = function () {
    navigator.clipboard.writeText(umlDisplayText.textContent);
  };

  //Save buttons in the modals
  let addRelBtn = document.getElementById('addRelBtn');
  let editRelBtn = document.getElementById('editRelBtn');
  let addAttBtn = document.getElementById('addAttBtn');

  //Get the <span> element that closes the modal
  let addSpan = document.getElementsByClassName('close')[0];
  let editSpan = document.getElementsByClassName('close')[1];
  let attSpan = document.getElementsByClassName('close')[2];
  let markDetailsSpan = document.getElementsByClassName('close')[3];
  let helpSpan = document.getElementsByClassName('close')[4];
  let umlSpan = document.getElementsByClassName('close')[5];

  //Menus for managing entities and relationships
  let rel = document.getElementById('relContent');
  let ent = document.getElementById('entContent');
  let manager = document.getElementById('managerScrollable');
  let mainContainer = document.getElementById('mainContainer');
  let closeBtn = document.getElementsByClassName('closebtn')[0];

  let sidebarWidth = '30%';

  function entityActive() {
    closeBtn.style.display = 'inline';
    ent.style.display = 'block';
    rel.style.display = 'none';
    manageEntBtn.className = manageEntBtn.className + ' active';
    manageSmEntBtn.className = manageSmEntBtn.className + ' active';
    manageRelBtn.className = manageRelBtn.className.replace(' active', '');
    manageSmRelBtn.className = manageSmRelBtn.className.replace(' active', '');
  }

  function relationshipActive() {
    closeBtn.style.display = 'inline';
    rel.style.display = 'block';
    ent.style.display = 'none';
    manageRelBtn.className = manageRelBtn.className + ' active';
    manageSmRelBtn.className = manageSmRelBtn.className + ' active';
    manageEntBtn.className = manageEntBtn.className.replace(' active', '');
    manageSmEntBtn.className = manageSmEntBtn.className.replace(' active', '');
  }

  function noneActive() {
    closeBtn.style.display = 'none';
    ent.style.display = 'none';
    rel.style.display = 'none';
    manageEntBtn.className = manageEntBtn.className.replace(' active', '');
    manageRelBtn.className = manageRelBtn.className.replace(' active', '');
    manageSmEntBtn.className = manageSmEntBtn.className.replace(' active', '');
    manageSmRelBtn.className = manageSmRelBtn.className.replace(' active', '');
  }

  function enableQuestionEditing() {
    // Enable editing
    manageEntBtn.style.display = 'inline';
    manageRelBtn.style.display = 'inline';
    manageSmEntBtn.style.display = 'inline';
    manageSmRelBtn.style.display = 'inline';
    manager.style.display = 'inline';
    saveBtn.style.display = 'inline';

    let inQuestionMenuItems = document.getElementsByClassName('dropbtn');
    for (i = 0; i < inQuestionMenuItems.length; i++) {
      inQuestionMenuItems[i].disabled = false;
    }
  }

  noneActive();

  //Alternating between Manage relationships and Manage entities (navigation bar logic)
  manageRelBtn.onclick = function () {
    updateRelManager();
    if (!this.className.includes('active')) {
      manager.style.width = sidebarWidth;
      relationshipActive();
    }
  };

  manageEntBtn.onclick = function () {
    updateEntManager();
    if (!this.className.includes('active')) {
      manager.style.width = sidebarWidth;
      entityActive();
    }
  };

  window.closeNav = function () {
    noneActive();
    if (manager.style.width == sidebarWidth) {
      manager.style.width = '0';
      mainContainer.style.marginRight = '0';
    }
  };

  //Small Screen navigation bar logic
  window.onresize = function () {
    if (window.innerWidth <= 750) {
      mainContainer.style.marginRight = '0';
      manager.style.width = '100%';
    } else if (closeBtn.style.display != 'none') {
      manager.style.width = sidebarWidth;
    } else {
      manager.style.width = '0';
    }
  };

  manageSmRelBtn.onclick = function () {
    updateRelManager();
    if (!this.className.includes('active')) {
      manager.style.width = '100%';
      relationshipActive();
    }
  };

  manageSmEntBtn.onclick = function () {
    updateEntManager();
    if (!this.className.includes('active')) {
      manager.style.width = '100%';
      entityActive();
    }
  };

  //Save buttons for the modals onclick setup
  addRelBtn.onclick = function () {
    let relationA = document.getElementById('relationA').value;
    let relationB = document.getElementById('relationB').value;
    let cardinalityA = document.getElementById('cardinalityA').value;
    let cardinalityB = document.getElementById('cardinalityB').value;
    let cardinality_Text = document.getElementById('cardinality_Text').value;
    addRelationship(relationA, relationB, cardinalityA, cardinalityB, cardinality_Text);
    addModal.style.display = 'none';
    manageRelBtn.onclick();
  };

  editRelBtn.onclick = function () {
    let id = parseInt(document.getElementById('relInfo').getAttribute('value'));
    let relationA = document.getElementById('newRelationA').value;
    let relationB = document.getElementById('newRelationB').value;
    let cardinalityA = document.getElementById('newCardinalityA').value;
    let cardinalityB = document.getElementById('newCardinalityB').value;
    let cardinality_Text = document.getElementById('newCardinality_Text').value;
    editRelationship(id, relationA, relationB, cardinalityA, cardinalityB, cardinality_Text);
    editModal.style.display = 'none';
    manageRelBtn.onclick();
  };

  addAttBtn.onclick = function () {
    let isPK = document.getElementById('PK').checked;
    let isPPK = document.getElementById('PPK').checked;
    let isAK = document.getElementById('AK').checked;
    let entityName = document.getElementById('attModalInfo').getAttribute('entity');
    let attributeName = document.getElementById('attModalInfo').getAttribute('attribute');
    let key = '';

    if (isPPK) {
      key = '{PPK}';
    } else if (isPK) {
      key = '{PK}';
    } else if (isAK) {
      key = '{AK}';
    }
    addAttribute(entityName, attributeName, key);
    attModal.style.display = 'none';
    manageEntBtn.onclick();
  };

  addSpan.onclick = function () {
    addModal.style.display = 'none';
    manageRelBtn.onclick();
  };

  editSpan.onclick = function () {
    editModal.style.display = 'none';
    manageRelBtn.onclick();
  };

  attSpan.onclick = function () {
    attModal.style.display = 'none';
    manageEntBtn.onclick();
  };

  markDetailsSpan.onclick = function () {
    markDetailsModal.style.display = 'none';
  };

  helpSpan.onclick = function () {
    helpModal.style.display = 'none';
  };

  umlSpan.onclick = function () {
    umlModal.style.display = 'none';
  };

  window.openAddModal = function () {
    updateAddRelModal();
    addModal.style.display = 'block';
    window.closeNav();
  };

  window.openEditModal = function (id) {
    updateEditRelModal(id);
    editModal.style.display = 'block';
    window.closeNav();
  };

  window.openAttModal = function (entityName, attributeName) {
    updateAttModal(entityName, attributeName);
    document.getElementById('noKey').checked = true;
    let enObj = schema.get(entityName);
    if (typeof enObj['attribute'].get(attributeName) != 'undefined') {
      let key = enObj['attribute'].get(attributeName)['key'].replace(/[{}]/g, '');
      if (key != '') {
        document.getElementById(key).checked = true;
      }
    }
    attModal.style.display = 'block';
    window.closeNav();
  };

  window.addEntity = function (element) {
    let cN = element.className.split(' ');
    let type = cN[0];
    let coordinates = cN[1].split('-');
    let i = coordinates[0];
    let j = coordinates[1];
    let entityName = toEntityName(element.parentElement.parentElement.getAttribute('nameer'));

    if (!schema.has(entityName)) {
      schema.set(entityName, { entity: entityName, attribute: new Map(), i: i, j: j });
    }

    updateEntityMenu(i, j, true);
    showAddAttribute();
    update();
  };

  window.removeEntity = function (entityName, i, j) {
    schema.delete(entityName);
    removeEntityRelationshipReferences(entityName);
    if (i == -1 && j == -1) {
      let allEntities1 = Array.from(document.getElementsByClassName(entityName));
      let allEntities2 = Array.from(
        document.getElementsByClassName(entityName[0].toLowerCase() + entityName.substring(1))
      );
      let allEntities = [].concat(allEntities1, allEntities2);
      for (let i = 0; i < allEntities.length; i++) {
        if (allEntities[i].className.indexOf(' disabled-link') >= 0) {
          allEntities[i].className = allEntities[i].className.replace(' disabled-link', '');
        }
      }
    } else {
      updateEntityMenu(i, j, false);
    }
    showAddAttribute();
    update();
  };

  function removeEntityRelationshipReferences(entityName) {
    relationships.forEach(function (rel, key) {
      if (rel.relationA == entityName || rel.relationB == entityName) {
        relationships.delete(key);
      }
    });
    update();
  }

  window.addAttribute = function (entityName, attName, key = '') {
    let enObj = schema.get(entityName);

    enObj['attribute'].set(attName, { attribute: attName, key: key });

    if (!attributes.has(attName)) {
      let enMap = new Map();
      enMap.set(enObj['entity']);
      attributes.set(attName, { attribute: attName, entities: enMap });
    } else {
      let attObj = attributes.get(attName);
      attObj['entities'].set(enObj['entity']);
    }

    showAddAttribute();
    update();
  };

  window.removeAtt = function (entityName, attName) {
    let enObj = schema.get(entityName);
    let attObj = attributes.get(attName);

    enObj['attribute'].delete(attName);

    attObj['entities'].delete(entityName);
    if (attObj['entities'].size == 0) {
      attributes.delete(attName);
    }

    showAddAttribute();
    update();
  };

  function addRelationship(relationA, relationB, cardinalityA, cardinalityB, cardinality_Text) {
    if (relationA != '' && relationB != '') {
      for (let value of relationships) {
        if (value[1].relationA === relationA && value[1].relationB == relationB) {
          let temp = relationA;
          relationA = relationB;
          relationB = temp;

          temp = cardinalityA;
          cardinalityA = cardinalityB;
          cardinalityB = temp;
          break;
        }
      }
      let relationship = {
        id: relCount,
        relationA: relationA,
        cardinalityA: cardinalityA,
        cardinalityB: cardinalityB,
        relationB: relationB,
        cardinality_Text: cardinality_Text
      };
      relationships.set(relCount, relationship);
      relCount++;
      update();
    } else {
      alert('Please choose two valid entities.');
    }
  }

  function editRelationship(id, relationA, relationB, cardinalityA, cardinalityB, cardinality_Text) {
    if (relationA != '' && relationB != '') {
      let relationship = {
        id: id,
        relationA: relationA,
        cardinalityA: cardinalityA,
        cardinalityB: cardinalityB,
        relationB: relationB,
        cardinality_Text: cardinality_Text
      };
      relationships.delete(id);
      relationships.set(id, relationship);
      update();
    } else {
      alert('Please choose two valid entities.');
    }
  }

  window.removeRelationship = function (id) {
    relationships.delete(id);
    relCount--;
    update();
  };

  function showAddAttribute() {
    for (let i = 0; i < lis.length; i++) {
      divs = lis[i].children;
      for (let j = 0; j < divs.length; j++) {
        if (schema.size == 0) {
          document.getElementById('sm-att-' + i + '-' + j).innerHTML =
            '<a class="disabled-link attribute ' + i + '-' + j + '">Add attribute</a>';
        } else {
          updateAttMenu(i, j);
        }
      }
    }
  }

  function updateEntityMenu(i, j, clicked) {
    let entityElement = document.getElementById('sm-entity-' + i + '-' + j);
    entityElement.innerHTML =
      '<a onclick="addEntity(this)" class="entity ' + i + '-' + j + '">Add entity</a>';
    let entity = entityElement.className.split(' ')[1];

    let allEntities = document.getElementsByClassName(entity);
    for (let i = 0; i < allEntities.length; i++) {
      if (clicked) {
        allEntities[i].className = allEntities[i].className + ' disabled-link';
      } else {
        allEntities[i].className = allEntities[i].className.replace(' disabled-link', '');
      }
    }
  }

  function updateAttMenu(i, j) {
    let attHTML = '';
    let attName = toAttributeName(
      document.getElementById('sm-att-' + i + '-' + j).parentElement.getAttribute('nameer')
    );
    let attObj = attributes.get(attName);

    attHTML +=
      '<a class="attribute ' +
      i +
      '-' +
      j +
      '" >Add attribute </a>' +
      '<div id="submenu-' +
      i +
      '-' +
      j +
      '" class="submenu-content">';
    schema.forEach(function (value, key) {
      let enObj = schema.get(key);
      if (typeof enObj['attribute'].get(attName) == 'undefined') {
        attHTML +=
          '<a onclick="addAttribute(this.className, \'' +
          attName +
          '\')" class="' +
          key +
          '" id="attribute' +
          i +
          '-' +
          j +
          '-' +
          key +
          '">' +
          value.entity +
          '</a>';
      } else {
        attHTML +=
          '<a class="disabled-link ' +
          key +
          '" id="attribute' +
          i +
          '-' +
          j +
          '-' +
          key +
          '">' +
          value.entity +
          '</a>';
      }
    });
    attHTML += '</div>';
    document.getElementById('sm-att-' + i + '-' + j).innerHTML = attHTML;
  }

  function updateRelManager() {
    let content = '';
    if (schema.size == 0) {
      content += '<p class="no-entity">No entities added</p>';
    } else {
      relationships.forEach(function (value, key) {
        content += '<div class="relWrapper">';
        if ((value['cardinality_Text']).includes('[')) {
          value['cardinality_Text'] = "";
        }
        content +=
          '<div class="relColumn"><div>' +
          value['relationA'] +
          '  ' +
          value['cardinalityA'] +
          ' -- ' +
          value['cardinality_Text'] +
          ' --' +
          value['cardinalityB'] +
          '  ' +
          value['relationB'] +
          '</div></div>';
        content +=
          '<div class="relColumn"><div class="manageRelBtns"><button type="button" onclick="openEditModal(' +
          value['id'] +
          ')" class="myBtnSmall"><i class="far fa-edit"></i></button>';
        content +=
          '<button type="button" onclick="removeRelationship(' +
          value['id'] +
          ')" class="myBtnSmall"><i class="far fa-trash-alt"></i></button></div></div>';
        content += '</div>';
      });

      if (relationships.size == 0) {
        content += '<p>No relationships added</p>';
      }
      content += '<p>';
      content += '<br>';
      content +=
        '<button type="button" id="addNewRel" onclick="openAddModal()" class="myBtn">Add new relationship</button>';
      content += '</p>';
    }
    document.getElementById('relContent').innerHTML = content;
  }

  function updateEntManager() {
    let content = '';
    if (schema.size == 0) {
      content += '<p class="no-entity">No entities added</p>';
    } else {
      schema.forEach(function (entValue, key) {
        content += '<div class="entWrapper">';
        content += '<table class="table" style="width: 300px><tbody>';
        content += '<tr class="entRow">';
        content += '<td class="entRow header cell" colspan="2">' + entValue.entity + '</td>';
        content +=
          '<td class="entRow header cell iconBtn" onclick="removeEntity(\'' +
          entValue.entity +
          "'," +
          entValue.i +
          ',' +
          entValue.j +
          ')"><btn><i class="far fa-trash-alt"></i></btn></td>';
        content += '</tr>';
        entValue.attribute.forEach(function (attValue, key) {
          content += '<tr class="entRow">';
          content += '<td class="cell" data-title="Name">';
          content += attValue.attribute + ' ' + attValue.key;
          content += '</td>';
          content +=
            '<td><btn id="editAttBtn" class="cell iconBtn" onclick="openAttModal(\'' +
            entValue.entity +
            "','" +
            attValue.attribute +
            '\')"><i class="fas fa-key"></i></btn></td>';
          content +=
            '<td><btn id="removeAttBtn" class="cell iconBtn" onclick="removeAtt(\'' +
            entValue.entity +
            "','" +
            attValue.attribute +
            '\')"><i class="far fa-trash-alt"></i></btn></td>';
          content += '</tr>';
        });
        content += '</tbody></table></div>';
      });
    }
    document.getElementById('entContent').innerHTML = content;
  }

  function updateAddRelModal() {
    let content = '';
    let entityOptions = '';
    let cardinalityOptions = '';
    let cardinalityOptions_text = '';

    schema.forEach(function (value, key) {
      let entityName = value['entity'];
      entityOptions += '<option value="' + entityName + '">' + entityName + '</option>';
    });

    for (let i = 0; i < cardinalities.length; i++) {
      cardinalityOptions +=
        '<option value="' + cardinalities[i] + '">' + cardinalities[i] + '</option>';
    }

    content += '<p>';
    content += '<span>Entity A: &nbsp;&nbsp;</span';
    content +=
      '<span><select name="relationA" id="relationA">' + entityOptions + '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Cardinality A: &nbsp;&nbsp;</span>';
    content +=
      '<span><select name="cardinalityA" id="cardinalityA">' +
      cardinalityOptions +
      '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Cardinality Text: &nbsp;&nbsp;</span>';
    if (cardinalityOptions_text != "") {
      if (cardinalityOptions_text.includes('_')) {
        cardinalityOptions_text = cardinalityOptions_text.replaceAll('_', '');
      }
      if ((rel.cardinality_Text).includes('[')) {
        rel.cardinality_Text = "";
      }
      content +=
        '<input type="text"  name="cardinality_Text" id="cardinality_Text" size="10" value=' + rel.cardinality_Text + '>';
    }
    else {
      content +=
        '<input type="text"  name="cardinality_Text" id="cardinality_Text" size="10">';
    }

    content += cardinalityOptions_text;
    content += '</p>';
    content += '<p>';
    content += '<span>Cardinality B: &nbsp;&nbsp;</span>';
    content +=
      '<span><select name="cardinalityB" id="cardinalityB">' +
      cardinalityOptions +
      '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Entity B: &nbsp;&nbsp;</span>';
    content +=
      '<span><select name="relationB" id="relationB">' + entityOptions + '</select></span>';
    content += '</p>';

    document.getElementById('addModalContent').innerHTML = content;
  }

  function updateEditRelModal(id) {
    let rel = relationships.get(id);

    let content = '';
    let entityOptions = '';
    let cardinalityOptions = '';

    schema.forEach(function (value, key) {
      let entityName = value['entity'];
      entityOptions += '<option value="' + entityName + '">' + entityName + '</option>';
    });

    for (let i = 0; i < cardinalities.length; i++) {
      cardinalityOptions +=
        '<option value="' + cardinalities[i] + '">' + cardinalities[i] + '</option>';
    }
    content += '<p id="relInfo" value="' + id + '">';
    content += '<span>Entity A: &nbsp;&nbsp;</span>';
    content += '<span><select name="relationA" id="newRelationA">';
    content +=
      '<option value="' +
      rel.relationA +
      '" selected disabled hidden>' +
      rel.relationA +
      '</option>';
    content += entityOptions + '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Cardinality A: &nbsp;&nbsp;</span>';
    content += '<span><select name="cardinalityA" id="newCardinalityA">';
    content +=
      '<option value="' +
      rel.cardinalityA +
      '" selected disabled hidden>' +
      rel.cardinalityA +
      '</option>';
    content += cardinalityOptions + '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Cardinality Text: &nbsp;&nbsp;</span>';
    if (cardinalityOptions_text != "") {
      if (cardinalityOptions_text.includes('_')) {
        cardinalityOptions_text = cardinalityOptions_text.replaceAll('_', '');
      }
      if ((rel.cardinality_Text).includes('[')) {
        rel.cardinality_Text = "";
      }
      content +=
        '<input type="text"  name="cardinality_Text" id="newCardinality_Text" size="10"  onkeypress="return /[a-z]/i.test(event.key)" value=' + rel.cardinality_Text + '>';
    }
    else {
      content +=
        '<input type="text"  name="cardinality_Text" id="newCardinality_Text" size="10" onkeypress="return /[a-z]/i.test(event.key)">';
    }

    content += cardinalityOptions_text;
    content += '</p>';

    content += '<p>';
    content += '<span>Cardinality B: &nbsp;&nbsp;</span>';
    content += '<span><select name="cardinalityB" id="newCardinalityB">';
    content +=
      '<option value="' +
      rel.cardinalityB +
      '" selected disabled hidden>' +
      rel.cardinalityB +
      '</option>';
    content += cardinalityOptions + '</select></span>';
    content += '</p>';

    content += '<p>';
    content += '<span>Entity B: &nbsp;&nbsp;</span>';
    content += '<span><select name="relationB" id="newRelationB">';
    content +=
      '<option value="' +
      rel.relationB +
      '" selected disabled hidden>' +
      rel.relationB +
      '</option>';
    content += entityOptions + '</select></span>';
    content += '</p>';

    document.getElementById('editModalContent').innerHTML = content;
  }

  function updateAttModal(entityName, attributeName) {
    let content = '';
    content +=
      '<p id="attModalInfo" entity="' +
      entityName +
      '" attribute="' +
      attributeName +
      '">Attribute ' +
      attributeName +
      ' in ' +
      entityName +
      ':</p>';
    document.getElementById('attributeInfo').innerHTML = content;
  }

  function update() {
    let answer = schemaToNomnomlSource();
    umlDisplayText.textContent = answer;
    studentAnswerBox.value = answer;
    let source = schemaToMermaidSource();
    let diagram = 'classDiagram';
    let graphDirection = 'TD';
    source = diagram + '\n' + 'direction' + graphDirection + '\n' + source;
    if (schema.size != 0) {
      mermaid.mermaidAPI.initialize({ startOnLoad: false });
      const cb = function (svgGraph) {
        document.getElementById('diagram').innerHTML = svgGraph;
      };
      mermaid.mermaidAPI.render('umlDiagram', source, cb);
    } else {
      document.getElementById('diagram').innerHTML = null;
    }
    updateRelManager();
    updateEntManager();
  }

  function schemaToMermaidSource() {
    let schemaText = [];
    schema.forEach(function (schemaItem, entKey) {
      let item = 'class ' + schemaItem.entity + ':::styling' + '{ ';
      schemaItem.attribute.forEach(function (attItem, attKey) {
        if (!attItem.key == '') {
          let key = '&#123' + attItem.key.substring(1, attItem.key.length - 1) + '&#125';
          item += attItem.attribute + ' ' + key;
        } else {
          item += attItem.attribute;
        }
        item += '\n';
      });
      item += '}';
      schemaText.push(item);
    });
    relationships.forEach(function (rel) {
      let item =
        rel.relationA +
        '"' +
        rel.cardinalityA +
        '"' +
        '--' +
        '"' +
        rel.cardinalityB +
        '"' +
        rel.relationB;

      if (rel.cardinality_Text === undefined) {
        rel.cardinality_Text = document.getElementById('cardinality_Text').value;
      }

      if (rel.cardinality_Text != "" && !(rel.cardinality_Text).includes('___')) {
        item +=
          ' : ' +
          rel.cardinality_Text;
      } else {
        item +=
          ':___';
      }
      schemaText.push(item);
    });
    let diagramMessage = document.getElementById('diagramMessage');

    if (schemaText.length == 0) {
      diagramMessage.innerHTML = 'Your ER Diagram is empty';
    } else {
      diagramMessage.innerHTML = '';
    }
    let source = schemaText.join('\n');

    return source;
  }

  function schemaToNomnomlSource() {
    let schemaText = [];
    schema.forEach(function (schemaItem, entKey) {
      let item = '[' + schemaItem.entity + '|';
      schemaItem.attribute.forEach(function (attItem, attKey) {
        if (!attItem.key == '') {
          item += attItem.attribute + ' ' + attItem.key;
        } else {
          item += attItem.attribute;
        }
        item += ';';
      });
      item = item.substring(0, item.length - 1);
      item += ']';
      schemaText.push(item);
    });
    relationships.forEach(function (rel) {
      let item =
        '[' +
        rel.relationA +
        ']' +
        rel.cardinalityA +
        ' - ' +
        rel.cardinalityB +
        '[' +
        rel.relationB +
        ']';

      if (rel.cardinality_Text === undefined) {
        rel.cardinality_Text = document.getElementById('cardinality_Text').value;
      }

      if (rel.cardinality_Text != "" && !((rel.cardinality_Text).includes('___'))) {
        item +=
          ' : ' +
          rel.cardinality_Text;
      } else {
        item += "";
      }
      schemaText.push(item);
    });
    let diagramMessage = document.getElementById('diagramMessage');

    if (schemaText.length == 0) {
      diagramMessage.innerHTML = 'Your ER Diagram is empty';
    } else {
      diagramMessage.innerHTML = '';
    }
    let source = schemaText.join('\n');

    return source;
  }

  function markdownToHTML(question) {
    let questionHTML = ''; 
    let insideSquare = false;
    let insideCircle = false;
    let innerHTML = '';
    let nameInER = '';
    questionHTML = questionHTML.concat('<li>');
    for (let i = 0; i < question.length; i++) {
      if (question.charAt(i) == '\n') {
        questionHTML = questionHTML.concat('</li><li>');
      }
      if (question.charAt(i) == '[') {
        insideSquare = true;
      } else if (question.charAt(i) == ']') {
        insideSquare = false;
      } else if (question.charAt(i) == '(') {
        if (question.charAt(i - 1) == ']') {
          insideCircle = true;
        } else {
          questionHTML = questionHTML.concat(question.charAt(i));
        }
      } else if (question.charAt(i) == ')') {
        if (insideCircle) {
          insideCircle = false;
          questionHTML = questionHTML.concat(
            '<div nameER="' + nameInER + '">',
            innerHTML,
            '</div>'
          );
          nameInER = '';
          innerHTML = '';
        } else {
          questionHTML = questionHTML.concat(question.charAt(i));
        }
      } else if (!insideCircle && !insideSquare) {
        questionHTML = questionHTML.concat(question.charAt(i));
      } else if (insideCircle) {
        nameInER = nameInER.concat(question.charAt(i));
      } else if (insideSquare) {
        innerHTML = innerHTML.concat(question.charAt(i));
      }
    }
    questionHTML = questionHTML.concat('</li>');
    return questionHTML;
  }

  function toEntityName(string) {
    let uppercase = string.toUpperCase();
    return uppercase.substring(0, 1) + string.substring(1, string.length);
  }

  function toAttributeName(string) {
    let lowercase = string.toLowerCase();
    return lowercase.substring(0, 1) + string.substring(1, string.length);
  }

  window.addEventListener('mouseup', function (event) {
    try {
      let entityBoxCatcher = event.target.parentNode.parentNode.parentNode.parentNode.parentNode;
      let relationshipBoxCatcher = event.target.parentNode.parentNode;
      let clickedElementParent = event.target.parentNode;
      if (event.target != manager && clickedElementParent != manager)
        if (relationshipBoxCatcher != manager && entityBoxCatcher != ent)
          window.closeNav();
    } catch (err) {
      window.closeNav();
    }
  });

  setQuestionMarkdown(questionData);
});
