/*
 * controller.js
 * Controls the state of the flashcard app using an instance of a Deck
 * requires makeKey() function defined in cards.js
 */

// Contoller globals
var DECKMGR;

//check for proper html5 support
if (!Modernizr.localstorage) {
  setMsg('Your browser does not support cool features of HTML5 like localstorage, therefore cannot use this app.');
}

// only get URL when necessary in case BlobBuilder.js hasn't defined it yet
get_blob_builder = function() {
    return document.BlobBuilder || document.WebKitBlobBuilder || document.MozBlobBuilder;
}

//show add form
function add() {
  hide('option-container');
  hotkeyDisable();
  document.getElementById('key').value = '';
  //document.getElementById('button-save').onclick = save;
  resetDisplay();
  show('modal-container');
  show('phrase-form');
  document.getElementById('phrase-1').focus();
}

//reset form fields
function cancel() {
  document.getElementById('phrase-1').value = '';
  document.getElementById('phrase-2').value = '';
  hotkeyEnable();
  resetDisplay();
  show('card-container');
  hide('option-container');
  updateDisplay();
}

//do action for a given hotkey
function checkHotkey(e) {
  var key = (window.event) ? event : e;
  //alert(key.keyCode);
  switch(key.keyCode) {
    case 32:
      flip();
      break;
    case 37:
      prev();
      break;
    case 39:
      next();
      break;
    case 40:
    case 38:
      flip();
      break;
  }
}

//return a html option node
function createOptionNode(value, text, is_selected) {
    var opt = document.createElement('option');
    opt.setAttribute('value', value);
    if (is_selected) {
        opt.setAttribute('selected', 'selected');
    }
    opt.appendChild(document.createTextNode(text));
    return opt;
}

//show conf screen for deleting a deck
function deckDelete() {
    hide('deck-choices');
    document.getElementById('deck-delete-name').innerHTML = DECKMGR.active().name;
    document.getElementById('deck-delete-count').innerHTML = DECKMGR.active().length();
    show('deck-delete-conf');
}

//generate drop down list for decks
function deckListCreate() {
    var elm = document.getElementById('deck-list');
    //clear previous entries
    elm.innerHTML = '';
    //static entries
    elm.appendChild(createOptionNode('add', 'Add new'));
    elm.appendChild(createOptionNode('', '----------------'));
    
    //dynamic entries
    for (var i=0 ; i<DECKMGR.length() ; i++) {
        var d = DECKMGR.deck_at_index(i);
        elm.appendChild(createOptionNode(i, d.name+' ('+d.length()+')', (d.key == DECKMGR.active().key)));
    }
}

//show option form for current deck
function deckRename() {
    hide('deck-choices');
    show('deck-form');
    document.getElementById('deck-form-value').focus();
}

//a deck was selected from the dropdown
//do add operation if value='add' was passed
//do nothing if value is blank or current deck is already selected
function deckSelect(value) {
    var current = 'default';
    hide('deck-form');
    switch(value) {
        case '':
        case current:
            //do nothing
            return;
            break;
        case 'add':
            //add operation
            document.getElementById('deck-key').value = '';
            document.getElementById('deck-form-value').value = '';
            hide('deck-choices');
            show('deck-form');
            document.getElementById('deck-form-value').focus();
            break;
        default:
            DECKMGR.deck_load(value);
            updateDisplay();
    }
}

function del() {
  document.getElementById('conf-msg').innerHTML = 'Are you sure you want to delete this card?';
  document.getElementById('conf-yes').onclick = delYes;
  document.getElementById('conf-no').onclick = delNo;
  hide('msg-container');
  optionsClose();
  show('conf');
}

//delete active deck and all cards
function delDeckYes() {
    DECKMGR.deck_delete();
    if (DECKMGR.length() <= 0) {
        init();
    }
    saveDeckCancel();
    updateDisplay();
}

function delNo() {
  hide('conf');
}

function delYes() {
    DECKMGR.active().deleteCard();
    updateDisplay();
    hide('conf');
}

//set form to edit the current card
function edit() {
  var card = DECKMGR.active().current();
  hotkeyDisable();
  resetDisplay();
  document.getElementById('phrase-1').value = card.phrase1;
  document.getElementById('phrase-2').value = card.phrase2;
  document.getElementById('key').value = card.key;
  show('phrase-form');
  document.getElementById('phrase-1').focus();
}

function export_csv() {
    var d = window.open('', 'export '+DECKMGR.active().name);
    d.document.open('text/csv');
    d.document.write('<html><textarea style="margin-top: 2px; margin-bottom: 2px; height: 287px; margin-left: 2px; margin-right: 2px; width: 462px; ">');
    for (var i=0 ; i<DECKMGR.active().length() ; i++) {
        var c = DECKMGR.active().current();
        d.document.write('"'+escape(c.phrase1)+'","'+escape(c.phrase2)+'"\n');
        DECKMGR.active().next();
    }
    d.document.write('</textarea></html>');
    d.document.close();
    return true;
}

//generate and prompt browser to download a .csv of
//current deck of cards
function eximExport() {
    var bb = new BlobBuilder;
    bb.append("Hello, world!");
    saveAs(bb.getBlob("text/plain;charset=utf-8"), "hello world.txt");
}

function eximImport() {
    hide('exim-button-container');
    show('exim-import-container');
}

// cancel file import
function eximImportCancel() {
    hide('exim-import-container');
    show('exim-button-container');
}

//display alternate phrase
function flip() {
    if (DECKMGR.mode_animations) {
        hotkeyDisable()
        if (document.getElementById('main').style.display == 'none') {
            $('#main-alt').toggle("slide", { direction: "down" }, 300);
            setTimeout("$('#main').toggle('slide', {direction: 'up'}, 300)",300);      
        } else {
            $('#main').toggle("slide", { direction: "up" }, 300);
            setTimeout("$('#main-alt').toggle('slide', {direction: 'down'}, 300)",300);
        }
        setTimeout('hotkeyEnable()', 300);
    } else {
        toggle('main');
        toggle('main-alt');
    }
}

function flipReset() {
    if (DECKMGR.mode_reverse) {
        document.getElementById('main').style.display = 'none';
        document.getElementById('main-alt').style.display = '';
    } else {
        document.getElementById('main').style.display = '';
        document.getElementById('main-alt').style.display = 'none';
    }
}

function hide(id) {
  document.getElementById(id).style.display = 'none';
}

function hotkeyDisable() {
  document.onkeydown = null;
}

function hotkeyEnable() {
  document.onkeydown = checkHotkey;
}

function init() {
  DECKMGR = new DeckMGR('deckmgr');
  //if deckmgr is empty it could be first run or need to be migrated
  if (DECKMGR.length() <= 0) {
    migrationCheck();
    //if still empty, add a default deck
    if (DECKMGR.length() <= 0) {
        var ndx = DECKMGR.createDeck('default');
        DECKMGR.deck_load(ndx);
    }
  }
  updateDisplay();
}

//return false if id is display:none
function isVisible(id) {
    return document.getElementById(id).style.display != 'none';
}

//migrate a previous schema to current if needed
function migrationCheck() {
    
    //prior to OO design
    var c = localStorage["cards"];
    if (c) {
        var deck = new Deck('deck');
        var cards = JSON.parse(localStorage["cards"]);
        for (var ndx=0; ndx < cards.length; ndx++) {
            var oldCard = JSON.parse(localStorage[cards[ndx]]);
            var newCard = new Card({'phrase1':oldCard['1'], 'phrase2':oldCard['2'], 'points':oldCard['points']});
            newCard.save();
            deck.add(newCard);
            localStorage.removeItem(cards[ndx]);
        }
        deck.save();
        localStorage.removeItem("cards");
    }
    
    //migrate to DeckMGR >= 0.6.2
    
    if (deck) {
    	var deck = localStorage['deck'];
        DECKMGR = new DeckMGR('deckmgr');
        //copy deck to new format
        var key = 'deck-'+makeKey();
        localStorage[key] = deck;
        
        //set the name
        var d = new Deck(key);
        d.name = 'default';
        d.save();
        
        //add to mgr and cleanup
        DECKMGR.deck_add(key);
        DECKMGR.deck_load(0);
        DECKMGR.save();
        localStorage.removeItem('deck');
    }
    /* { "key": "p2kQoHXjvO", "phrase1": "test", "phrase2": "one", "points": 0 }
     * 
     * 
     */
    var data = [{"phrase1":"401k plan","phrase2":"A qualified retirement plan in which the employee can set aside a portion of their income with pre-tax dollars. "},
                {"phrase1":"Absolute Assignment vs. Collateral Assignment","phrase2":" Absolute: A permanent and irrevocable transfer of rights and/or benefits by the policyowner. Collateral: A temporary and/or revocable transfer of benefits by the policyowner. "},
                {"phrase1":"Accelerated Death Benefit","phrase2":"Policy provision that allows full or partial payment of the policy's death benefit before the insured's death if he/she is terminally ill. "},
                {"phrase1":"Accidental Death Benefit","phrase2":"An extra cost rider that requires the insurance company to pay an additional benefit in the event that the insured dies within 90 days of an accident as a direct result of the accident. "},
                {"phrase1":"Accumulate at Interest","phrase2":"The Dividend Option where the policyowner leaves the dividends with the insurer to invest and earn interest. "},
                {"phrase1":"Adhesion","phrase2":"Since the insurer created all the documents of the contract"},
                {"phrase1":"Adverse Selection","phrase2":"The tendency for less favorable risks to seek or continue insurance to a greater extent than more favorable risks. "},
                {"phrase1":"Agency Agreement or Agency Contract","phrase2":"A legal document containing the terms of the agreement between the agent and the insurance company. It clearly defines what an agent can and cannot do"},
                {"phrase1":"Agent Authorities","phrase2":"Expressed: Power or authority specifically granted in writing to an agent by the insurance company in their Agency Agreement. Apparent: Power or authority that the public reasonably assumes an agent has based upon his/her actions. Implied: Power or authority that is not expressly granted by the company but that an agent can assume or that are implied he/she has in order to transact insurance business. "},
                {"phrase1":"Agent/Producer","phrase2":"Anyone who sells or aids in the selling of insurance. Legally represents the company. Cash Settlement Option"},
                {"phrase1":"Agent's Report","phrase2":"A written report from the agent submitted to the insurer along with the application disclosing what the agent knows"},
                {"phrase1":"Aleatory","phrase2":"Unequal exchange of value. One party may obtain a far greater value than the other under the contract. "},
                {"phrase1":"Annual Renewable Term","phrase2":"A Term Life Insurance contract which gives the policyowner the option to renew the policy each year without showing proof of insurability. Premiums increase at each renewal. "},
                {"phrase1":"Annuitant","phrase2":"The person that buys an annuity; may or may not be an annuity's policyowner. "},
                {"phrase1":"Annuity","phrase2":"A contract/policy that guarantees to pay income for a specified period of time or for the life of the annuitant. Designed to prevent people from outliving their savings. "},
                {"phrase1":"Appointment","phrase2":"Authorization of an agent/producer by an insurer to represent the company. "},
                {"phrase1":"Blackout Period","phrase2":"The period of time between the youngest child turning 16 and the widow(er) reaching retirement age during which no Social Security Survivor Benefits are paid to the surviving spouse. "},
                {"phrase1":"Buy-Sell Agreement","phrase2":"Business use of Life Insurance where partners in a business buy life insurance on each other. They agree that when one of them dies the survivors have the right to purchase the deceased partner's share of the business. The death benefit from the insurance is used to finance the purchase. "},
                {"phrase1":"Cash Nonforfeiture Option","phrase2":"Policyowner receives a lump-sum payment of the current cash value of the policy upon surrender of the policy. The policy cannot be reinstated. "},
                {"phrase1":"Cash Value","phrase2":"That part of an insurance policy that is the equity amount legally available to the policyowner. The cash value accumulates throughout the duration of the policy. Also known as living benefit or policy savings. "},
                {"phrase1":"Commissioner","phrase2":"Public official in charge of the state's department of insurance. Charged with regulating the insurance industry in his/her state by enforcing the insurance laws. "},
                {"phrase1":"Conditional","phrase2":"Certain conditions must be met in order for policy to pay-out. "},
                {"phrase1":"Conditional Receipt","phrase2":"An interim insuring agreement under which the insurance company agrees to start coverage on the later of either the date of application or the date of the medical exam IF the proposed insured is found to be insurable on that date. "},
                {"phrase1":"Consideration","phrase2":"A necessary element of a contract; something of value exchanged for the transfer of risk. Insured's consideration is payment of premiums and truthful statements on the application. Insurer's consideration is promises contained in the contract. "},
                {"phrase1":"Contingent Beneficiary","phrase2":"An alternate beneficiary designated to receive the policy proceeds in the event that the primary beneficiary dies before the insured. "},
                {"phrase1":"Contributory Plan vs. Noncontributory Plan","phrase2":"Contributory: Group insurance plan under which the employees contribute to the payment of premiums. Noncontributory: A group insurance plan in which the employer pays all the premiums for the policy. "},
                {"phrase1":"Convertible Term","phrase2":"Term insurance that specifically permits -conversion- of the policy into permanent protection without proof of insurability."},
                {"phrase1":"Decreasing Term","phrase2":"Term life insurance in which the face amount of the policy decreases over time in scheduled steps. Most often used to cover a debt obligation (mortgage). "},
                {"phrase1":"Dividends","phrase2":"Distributions paid out by insurance companies. Stock insurers pay dividends (portion of profit) to stockholders and they are taxable. Mutual insurers pay dividends (return of unneeded premiums) to policyowners and they are not taxable. Dividends are never guaranteed. "},
                {"phrase1":"Equity Indexed Annuity","phrase2":"The annuity that has a guaranteed minimum interest rate and allows the annuitant to invest money in an index (i. e. : S&P 500). The investments grow as the index grows."},
                {"phrase1":"Estoppel","phrase2":"Legally preventing someone from asserting or reasserting a known right that they have previously waived. "},
                {"phrase1":"Extended Term Insurance","phrase2":"Nonforfeiture option where cash value is used to make a single premium payment on a Term Insurance Policy of the same face amount as the original policy. Original policy can be reinstated. Not available on rated policies. "},
                {"phrase1":"Face Amount","phrase2":"Amount payable in the event of death of the insured. Also called face value"},
                {"phrase1":"Facultative Reinsurance vs. Treaty Reinsurance","phrase2":"Facultative: Transferring risk from one insurance company to another on a policy-by-policy basis. Treaty: Transferring risk from one insurance company to another under a blanket agreement. "},
                {"phrase1":"Fair Credit Reporting Act","phrase2":"A federal law that protects consumers in regard to their credit history. Establishes guidelines for how companies can access consumers' credit reports and what types of disclosures and notifications are required. "},
                {"phrase1":"Financial Needs Approach","phrase2":"In determining how much life insurance is needed the needs of the surviving family are the focus. Using needs analysis worksheets"},
                {"phrase1":"Fixed Amount Annuity","phrase2":"A Life Annuity that guarantees a fixed dollar payment at regular intervals during the lifetime of the annuitant. "},
                {"phrase1":"Fixed Amount Settlement Option","phrase2":"Upon maturity of an insurance policy the beneficiary receives periodic payments of a set dollar amount from the policy proceeds."},
                {"phrase1":"Fixed Period Settlement Option","phrase2":"Upon maturity of an insurance policy"},
                {"phrase1":"Free Look Provision","phrase2":"A policy provision required by state law that establishes a set number of days (usually 10) for the policyowner to review a newly issued policy. The policyowner may return the policy to the insurer during this time for any reason and receive a 100% refund. Also known as refund provision"},
                {"phrase1":"General Account v. Separate Account","phrase2":"General Account: Contains the regulated"},
                {"phrase1":"Grace Period","phrase2":"A prescribed period of time during which the policy stays in force without the payment of premiums. Mandated by state law and is usually 30 or 31 days. "},
                {"phrase1":"Graded Premium Policy","phrase2":"Premiums for the policy increase regularly for 5 to 20 years and then level off. Death benefit remains level. "},
                {"phrase1":"Group Insurance","phrase2":"An insurance policy that covers multiple people (who have a common interest). A Master Policy is issued to the policyowner and individual insureds receive Certificates of Insurance. "},
                {"phrase1":"Guaranteed Insurability Rider","phrase2":"Optional rider that enables the policyowner to purchase additional amounts of coverage at predetermined times without proof of insurability. "},
                {"phrase1":"Guaranty Association","phrase2":"A state mandated association of all insurance companies designed to protect consumers from impaired or insolvent companies. "},
                {"phrase1":"Hazard","phrase2":"anything that increases the likelihood that a loss will occur (Faulty wiring). "},
                {"phrase1":"Human Life Value Approach","phrase2":"In determining how much life insurance is needed the worker's annual earnings are multiplied by the number of years remaining until he/she retires. From the resulting figure taxes and expenses are subtracted. "},
                {"phrase1":"Immediate Annuity v. Deferred Annuity","phrase2":"Immediate: A Life Annuity contract where the first pay-out is made within 12 months after it is purchased. Can only be purchased with a single premium/lump-sum payment. Deferred: A Life Annuity contract where the first pay-out is made 12 months after it is purchased. Can be purchased with either a single premium or with continuous premium payments. "},
                {"phrase1":"Incontestable Clause","phrase2":"A state mandated provision that limits the amount of time that an insurer can rescind a policy or contest a claim due to misrepresentation or concealment. "},
                {"phrase1":"Indemnify","phrase2":"To make financially whole again; restore to the condition enjoyed before a loss was suffered; to replace what was lost. Insurance is not designed for parties to profit from a loss. "},
                {"phrase1":"Individual Retirement Account (IRA)","phrase2":"A qualified retirement plan for any individual with earned income. "},
                {"phrase1":"Insurable Interest","phrase2":"A financial interest in the life of another person. In a position to loose something of value if the insured should die. "},
                {"phrase1":"Insurer/Principal","phrase2":"The insurance company; underwrites the policy and assumes the risk. "},
                {"phrase1":"Insuring Clause","phrase2":"The heart of an insurance policy. It contains the company's promise to the policyowner and describes the coverage provided and the policy limits. "},
                {"phrase1":"Interest Settlement Option","phrase2":"Upon maturity of an insurance policy the beneficiary receives periodic payments of the interest earned from the company's investment of the policy proceed. "},
                {"phrase1":"Joint and Survivor Annuity","phrase2":"An annuity that makes payments to two or more annuitants throughout their lifetimes. Payments normally reduce at the death of each annuitant and stop altogether upon the death of the last annuitant."},
                {"phrase1":"Keogh Plan (HR10)","phrase2":"A qualified retirement plan for self-employed people and their eligible employees. Contributions are tax deductible and interest earned is deferred until withdrawn. "},
                {"phrase1":"Lapsed Policy","phrase2":"A policy that is no longer in force due to unpaid premiums. Also known as forfeit"},
                {"phrase1":"Law of Agency","phrase2":"The actions of an agent/producer within the scope of the authority granted to him/her by the insurer become the actions of the company. "},
                {"phrase1":"Law of Large Numbers","phrase2":"States that larger numbers of similar risks grouped together become more accurately predictable. "},
                {"phrase1":"Level Term Insurance","phrase2":"Term insurance where the face value of policy remains the same from the date the policy is issued until the date the policy expires. "},
                {"phrase1":"License","phrase2":"Documentation issued by a state's department of insurance to an individual verifying that he/she is qualified to engage in the insurance business. "},
                {"phrase1":"Life Annuity With Period Certain","phrase2":"A Life Annuity that guarantees to provide income payments for a minimum period of time or life. Payments will continue to a beneficiary should the annuitant die during the specified period. "},
                {"phrase1":"Life Annuity/Straight Life Annuity","phrase2":"Upon maturity of an Annuity Contract the annuitant elects to receive fixed periodic payments for the rest of his/her life."},
                {"phrase1":"Life Income Settlement Option","phrase2":"Upon maturity of an insurance policy"},
                {"phrase1":"Medical Information Bureau","phrase2":"An organization that stores information from insurance companies and makes it available to other companies during the underwriting process. Its purpose is to help prevent fraud and concealment by insurance applicants. "},
                {"phrase1":"Modified Endowment Contract (MEC)","phrase2":"Any cash value policy that builds cash value faster than a Seven-Pay Whole Life Contract and therefore loses the tax advantages of life insurance. "},
                {"phrase1":"Modified Life Policy","phrase2":"Whole Life Insurance with reduced premiums during the initial years and higher premiums during later years. Can be structured as Term insurance during the initial years and changing to Whole Life in the later years. "},
                {"phrase1":"Nonforfeiture Options","phrase2":"Three options available by law to policyowners that enable them to recover a policy's cash-value upon surrender of that policy. (1) Cash (2) Reduced Paid-Up Insurance (3) Extended Term Insurance."},
                {"phrase1":"Non-qualified Retirement Plan","phrase2":"A retirement plan that does not qualify for special tax treatment by the IRS. "},
                {"phrase1":"Participating Company","phrase2":"Also known as a Mutual Company. Returns unused premium in the form of a policy dividend to the policy owners. "},
                {"phrase1":"Payor Rider","phrase2":"Optional rider that costs extra and will pay the premiums of a Juvenile Policy if the owner dies or becomes disabled. "},
                {"phrase1":"Peril","phrase2":"The cause of a loss (Fire)"},
                {"phrase1":"Policy Loan Provision","phrase2":"Describes the conditions by which a policyowner can borrow from the policy's cash value. "},
                {"phrase1":"Policy Owner","phrase2":"The person in an insurance contract that has all the rights contained in the policy; designated on the application and may or may not be the insured. "},
                {"phrase1":"Policy Payment Methods","phrase2":"Continuous Premium: Insurance or an annuity that is paid for continuously throughout the duration of the policy. Requires the smallest payments amounts and grows cash value the slowest. Limited Pay: Insurance or an annuity that is paid for over a specified period of time after which no further premium payments are required during the duration of the policy. Known as Life Paid Up or x-Pay Life policies. Single Premium: Insurance or an annuity that is paid for with a single lump-sum payment. No further premium payments are required during the duration of the policy. Requires the largest payment amount of any type of policy. Grows cash value the fastest. "},
                {"phrase1":"Proof of Insurability","phrase2":"A statement about or evidence of a person's physical and/or mental health"},
                {"phrase1":"Qualified Retirement Plan","phrase2":"A retirement plan that meets certain federal requirements and therefore qualifies for special tax treatment. Plans must be (1) for the exclusive benefit of employees"},
                {"phrase1":"Rebating","phrase2":"Anything of value given by an agent to a client as an inducement to buy insurance. "},
                {"phrase1":"Reduced Paid-up Insurance","phrase2":"Nonforfeiture option where cash value is used to make a single premium payment to purchase as much of the same type of insurance as possible. Face amount of the new policy would be less than the original policy but no further premium payments would be necessary. Policy can be reinstated. "},
                {"phrase1":"Reinstatement Clause","phrase2":"Contained in the policy this clause described how a policy can be restored to its original condition. It states the conditions"},
                {"phrase1":"Reinsurance","phrase2":"The sharing of risk between insurance companies. One insurance company sells part of its risk to another insurance company. "},
                {"phrase1":"Renewable Term","phrase2":"Term insurance where at the end of the specified term the policyowner has the right to continue the policy for another term without proof of insurability. Premiums will be determined by the new attained age. "},
                {"phrase1":"Replacement","phrase2":" The exchange of one policy for another. Replacement regulations must be followed. "},
                {"phrase1":"Representations","phrase2":"Statements made by an applicant or an insured that are true to the best of his or her knowledge and belief. "},
                {"phrase1":"Revocable Beneficiary v. Irrevocable Beneficiary","phrase2":"Revocable: A beneficiary named by the policy owner that can be changed by the policyowner at his/her discretion. Irrevocable: A beneficiary named by the policy owner that can not be changed by the policyowner at his/her discretion. Changing this beneficiary requires the permission of the beneficiary. "},
                {"phrase1":"Riders","phrase2":"Optional coverages that can be added to policies that provide additional benefits or protections. Vary from policy to policy and company to company. Also known as addendums"},
                {"phrase1":"Risk Classifications","phrase2":"Standard Risk: A normal or average risk; no special conditions are required in the policy. Substandard Risk: A high risk; requires special conditions to be included in the policy or issued a rated policy. Preferred Risk: Less risky than the normal or average risk. Usually issued policies on a discounted basis. "},
                {"phrase1":"Roth IRA","phrase2":"A non-tax deductible individual retirement account which grows tax free after 5 years. "},
                {"phrase1":"Settlement Options","phrase2":"The five ways that the proceeds of a policy can be paid upon maturity. (1) Cash (2) Interest Only (3) Fixed Period (4) Fixed Amount (5) Life Income"},
                {"phrase1":"Speculative Risk","phrase2":"The possibility of experiencing either a loss or a gain. Gambling is an example of speculative risk. "},
                {"phrase1":"Spendthrift Clause","phrase2":"State legislation that protects the rights of policyowners and beneficiaries from creditors. Death benefits cannot be attached by creditors of the policyowner. "},
                {"phrase1":"Stock Insurer","phrase2":"An insurance company publicly owned and controlled by its stockholders who elect a board of directors to manage it. "},
                {"phrase1":"Tax Sheltered Annuity (403B)","phrase2":"A qualified retirement program for employees of non-profit organizations. Contributions are made through a salary reduction program. "},
                {"phrase1":"Third Party Ownership","phrase2":"When a person(s) other than the insured purchases the insurance policy. "},
                {"phrase1":"Twisting","phrase2":"Knowingly making misleading statements or making fraudulent comparisons in order to induce a client to drop a policy with an existing insurer and start a new one with a different company."},
                {"phrase1":"Underwriting","phrase2":"The process by which an insurer evaluates"},
                {"phrase1":"Uniform Simultaneous Death Act","phrase2":"It directs that in life insurance if the insured and the primary beneficiary die at the same time the policy benefits are payable as if the insured outlived the beneficiary."},
                {"phrase1":"Unilateral","phrase2":"One-sided promise. Only one party makes a legally enforceable promise. The insurance company promises to pay the policy proceeds at some future date or event. "},
                {"phrase1":"Universal Life Insurance (UL)","phrase2":"n -interest sensitive- flexible premium life insurance policy. A combination of ART and cash value. Has two death benefit options (A & B) and develops cash value. "},
                {"phrase1":"Variable Annuity","phrase2":"The product is invested in a separate account and has no guaranteed rate of growth. The annuity promises to pay a fixed number of annuity units to the annuitant for the rest of his/her life. The value of the annuity units varies depending on the performance of the investments of the separate account. "},
                {"phrase1":"Variable Life Insurance (VL)","phrase2":"Whole Life Insurance with fixed premiums. Cash value is invested in -separate accounts-. A minimum death benefit is guaranteed but could increase if the investments do well. "},
                {"phrase1":"Variable Universal Life Insurance (VUL)","phrase2":"A Life Insurance policy that combines the flexibility of Universal Life with the investment of the cash values in separate accounts from Variable Life. "},
                {"phrase1":"Waiver of Premium Rider","phrase2":"Optional rider that requires an insurer to assume payment of premiums should the insured become totally disabled for six months for the duration of the disability. "},
                {"phrase1":"Warranty","phrase2":"Statements made that are guaranteed to be absolutely true. Statements made by the insurer must be warranties. "},
                {"phrase1":"Whole Life Insurance","phrase2":"Type of insurance where level coverage lasts until death or age 100 and then the policy matures and pays out either the face amount or the cash value. Also known as straight life"}];
    var key = "Life Terms";
    var deck = new Deck(key);
    for (var ndx=0; ndx < data.length; ndx++) {
        var newCard = new Card(data[ndx]);
        newCard.save();
        deck.add(newCard);
    }
    
    deck.save();
//    var key = 'deck-'+makeKey();
//    localStorage[key] = deck;
//    var d = new Deck(key);
//    d.name = 'Life Terms';
//    d.save();
    
    //add to mgr and cleanup
    DECKMGR.deck_add(key);
    DECKMGR.deck_load(0);
    DECKMGR.save();
}

function msgClose() {
  document.getElementById('msg-container').style.display = 'none';
}

function navShow(){
  show('bottom-panel');
  show('button-delete');
  show('button-edit');
  show('meter');
  show('options-container');
  show('stats');
}

function navHide() {
  hide('add-another');
  hide('bottom-panel');
  hide('button-delete');
  hide('button-edit');
  hide('meter');
  hide('options-container');
  hide('stats');
}

//display next card
function next() {
    hotkeyDisable();
    DECKMGR.active().next();
    if (DECKMGR.mode_animations) {
        if (isVisible('main')) {
            $('#main').hide("slide", { direction: "left" }, 300, function () {updateDisplay()});
        } else {
            $('#main-alt').hide("slide", { direction: "left" }, 300, function () {updateDisplay()});
        }
    } else {
        hide('main');
        updateDisplay();
    }
    //updateDisplay();
}

//hide edit/del options
function optionHide() {
    hide('option-del');
    hide('option-edit');
}

//show edit/del options
function optionShow() {
    show('option-del');
    show('option-edit');
    show('deck-choices');
}

function options() {
    hotkeyDisable();
    hide('phrase-form');
    hide('deck-delete-conf');
    deckListCreate();
    show('modal-container');
    show('option-container');
}

function optionsClose() {
    hotkeyEnable();
    cancel();
    hide('deck-form');
    hide('option-container');
    hide('phrase-form');
    hide('modal-container');
}

//adjust point of card
function pointDown() {
    var card = DECKMGR.active().current();
    card.pointDown();
    card.save();
    next();
}

function pointUp() {
    var card = DECKMGR.active().current();
    card.pointUp();
    card.save();
    next();
}

//display previous card
function prev() {
    hotkeyDisable();
    DECKMGR.active().prev();
    if (DECKMGR.mode_animations) {
        if (isVisible('main')) {
            $('#main').hide("slide", { direction: "right" }, 200, function () {updateDisplay({'direction':'left'})});
        } else {
            $('#main-alt').hide("slide", { direction: "right" }, 200, function () {updateDisplay({'direction':'left'})});
        }
    } else {
        hide('main');
        updateDisplay({'direction':'left'});
    }
}

function reset() {
  document.getElementById('conf-msg').innerHTML = 'Are you sure you want to reset everything?';
  document.getElementById('conf-yes').onclick = resetYes;
  document.getElementById('conf-no').onclick = resetNo;
  hide('msg-container');
  show('conf');
  document.getElementById('conf-no').focus();
}

//clear all blocks that may be showing in the main display
function resetDisplay() {
  hide('add-another');
  hide('card-container');
  hide('option-container');
  hide('phrase-form');
}

function resetYes() {
  localStorage.clear();
  setMsg('Reset settings');
  initDeck();
  hide('conf');
}

function resetNo() {
  setMsg('Reset canceled');
  hide('conf');
}

// save card form
function save() {
  var phrase1 = document.getElementById('phrase-1').value;
  var phrase2 = document.getElementById('phrase-2').value;
  
  if (!phrase1 || !phrase2) {
    return;
  }
  
  var key = document.getElementById('key').value;
  var card;
  var msg = '';
  //key is set -> edit
  if (key) {
    card = new Card({'key':key});
    card.phrase1 = phrase1;
    card.phrase2 = phrase2;
    card.save();
    //msg = 'Card updated';
  } else {
    card = new Card({'phrase1':phrase1,'phrase2':phrase2});
    card.save();
    DECKMGR.active().add(card);
    DECKMGR.active().save();
  }
  
  cancel();
  updateDisplay();
  resetDisplay();
  show('add-another');
  document.getElementById('button-add-another').focus();
  hotkeyEnable();
  setTimeout("msgClose()", 5000);
}

//save deck
function saveDeck() {
    var name = document.getElementById('deck-form-value').value;
    if (!name) {
        return;
    }
    
    var index = document.getElementById('deck-key').value;
    
    var d;
    if (index) {
        //edit
        d = DECKMGR.deck_at_index(index);
        d.name = name;
        d.save();
    } else {
        //add new
        index = DECKMGR.createDeck(name);
    }
    
    //must load to update deckmgr instance
    DECKMGR.deck_load(index);
    
    //update list
    updateDisplay();
    saveDeckCancel();
}

//cancel save operation, redo display
function saveDeckCancel() {
    show('deck-choices');
    hide('deck-form');
    hide('deck-delete-conf');
}

function show(id) {
  document.getElementById(id).style.display = '';
}

//shuffles the deck
function shuffle() {
    DECKMGR.active().shuffle();
    updateDisplay();
}

//show a message dialog
function setMsg(msg, handler) {
  var elm = document.getElementById('msg')
  if (handler) {
    elm.onclick = handler;
  } else {
    elm.onclick = function () {msgClose();};
  }
  elm.innerHTML = msg;
  hide('conf');
  show('msg-container');
}

function setStats(msg) {
  document.getElementById('stats').innerHTML = msg;
}

//toggle visibility of an id
function toggle(id) {
  if (document.getElementById(id).style.display == 'none') {
    document.getElementById(id).style.display = '';
  } else {
    document.getElementById(id).style.display = 'none';
  }
}

function toggleOption(elm) {
    //find option and do work
    switch(elm.id) {
      case 'lows':
        DECKMGR.active().toggleLow();
        break;
      case 'highs':
        DECKMGR.active().toggleHigh();
        break;
      case 'option-animation':
        DECKMGR.toggleAnimation();
        break;
      case 'option-reverse':
        DECKMGR.toggleReverse();
        break;
    }
  updateDisplay();
}

//show/hide the options
function toggleOptionsShow() {
  toggle('options');
  //change container class to show state
  var elm = document.getElementById('options-container');
  if (elm.className == 'on') {
    elm.className = 'off';
  } else {
    elm.className = 'on';
  }
}

jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + 
                                                $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
    return this;
};

//set display for the current card
function updateDisplay(opts) {
	var windowHeight = $(window).height();
	$('body').height( windowHeight );
    if (opts == undefined) {
        opts = {'direction':'right'};
    }
    flipReset();
    hide('conf');
    var card = DECKMGR.active().current();
    if (!card) {
        // set help text for first run.
        //navHide();
        //hide edit/del options when there are 0 cards
        setMsg('no cards in this deck, click here to add', function () {add();});
        optionHide();
        document.getElementById('main').innerHTML = 'Click here to toggle';
        document.getElementById('main-alt').innerHTML = 'Now add some';
        //document.getElementById('button-add').focus();
        setStats('0 cards');
        show('card-container');
    } else {
        //navShow();
        hide('msg-container');
        optionShow();
        document.getElementById('main').innerHTML = /*escape*/(card.phrase1);
    //    $("#main").center();
        document.getElementById('main-alt').innerHTML = /*escape*/(card.phrase2);
  //      $("#main-alt").center();
        //document.getElementById('meter').innerHTML = card.points;
        document.getElementById('key').value = card.key;
        
        setStats((DECKMGR.active().index+1) + ' / ' + DECKMGR.active().length());
    }
    
    if (DECKMGR.mode_reverse) {
        if (DECKMGR.mode_animations) {
            $('#main-alt').show("slide", { direction: opts['direction'] }, 200);
        } else {
            show('main-alt');
        }
        
    } else {
        if (DECKMGR.mode_animations) {
            $('#main').show("slide", { direction: opts['direction'] }, 200);
        } else {
            show('main');
        }
    }
    
    updateOptions();
    hotkeyEnable();
}

//update the state of the options to show current state
function updateOptions() {
    deckListCreate();
    document.getElementById('deck-key').value = DECKMGR.index;
    document.getElementById('deck-form-value').value = DECKMGR.active().name;
    document.getElementById('option-animation').className = (DECKMGR.mode_animations) ? 'switch-on' : 'switch-off';
    document.getElementById('option-reverse').className = (DECKMGR.mode_reverse) ? 'switch-on' : 'switch-off';
}