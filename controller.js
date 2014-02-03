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
    if (value == 2){
    	document.getElementById('copyCard').innerHTML = 'Remove from My Deck';  	
    }else{
    	document.getElementById('copyCard').innerHTML = 'Copy to My Deck';  
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
  $( window ).on( "orientationchange", function( event ) {
	  setTimeout("updateDisplay()",500);
	});
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
    
    var terms = [{"phrase1":"Absolute Assignment","phrase2":"A transfer by the policyholder of all control and rights to a third party."},
                 {"phrase1":"Accumulation at Interest Option","phrase2":"A dividend or settlement option under which the policyholder allows his dividends or policy proceeds to accumulate interest with the company. Although the dividends or proceeds are not generally taxable, the interest earned is."},
                 {"phrase1":"Actuary","phrase2":"One concerned with the application of probability and statistical theory to insurance, utilizing the law of large numbers."},
                 {"phrase1":"ADB","phrase2":"Accidental Death Benefit (also known as Double Indemnity). A rider added to a Life policy that will pay double the face amount if the insured dies as a result of accident, generally within 90 days of the accident."},
                 {"phrase1":"Adverse Selection","phrase2":"Selection not in favor of the company. For example, a person who is already sick would like to buy health insurance."},
                 {"phrase1":"Adverse Underwriting Decisions, Consumer Rights","phrase2":"Under the Fair Credit Reporting Act, when an adverse underwriting decision is made, the insurer must provide the applicant or policyholder with specific written reasons for the decision, or advise the individual that specific reasons are available upon written request. Upon receipt of the written request, the insurer must furnish specific reasons for the adverse decision and the names and addresses of the sources that provided the information."},
                 {"phrase1":"Agent/Producer","phrase2":"The individual appointed by an insurance company to solicit and negotiate insurance contracts on its behalf. Agents or Producers represent the company, not the client."},
                 {"phrase1":"Alien Company","phrase2":"An insurer organized and domiciled in a country other than the United States."},
                 {"phrase1":"Annuitant","phrase2":"The party receiving the benefits of an annuity, similar to the insured on an insurance policy. The annuitant usually also owns the annuity, although you can buy an annuity to benefit another party, who would then be the annuitant."},
                 {"phrase1":"Annuity","phrase2":"An agreement by an insurer to make periodic payments that continue during the lifetime of the annuitant(s) or for a specified period. Annuities are considered to be the opposite of life insurance, since annuities pay while your alive and life insurance pays when you die. Life insurance proceeds create an estate, while annuities are used to liquidate an estate over a period of time. All annuities are insurance products and a life insurance license is required."},
                 {"phrase1":"Applicant","phrase2":"The party making application to the insurance company for the policy. Applicants must provide the insurer with the truth to the best of their knowledge, which is known as a representation. Application"},
                 {"phrase1":"Assignee","phrase2":"The person to whom policy rights are assigned in whole or in part by the policyholder, who is known as the Assignor. On Life insurance there are 2 types of assignment"},
                 {"phrase1":"Assignment","phrase2":"Transfer of rights in a policy to another party by the policyholder. For example, if you bought a life insurance policy on a minor child, you are the owner and the child is the insured. When the child reaches age 21, you could assign all rights of ownership in the policy to the child. This is an absolute assignment."},
                 {"phrase1":"Attained Age","phrase2":"The present or current age of the insured. Upon conversion, premiums are based on the current age of the insured."},
                 {"phrase1":"Authorized Company","phrase2":"An insurer permitted to sell insurance within a state. Must obtain a Certificate of Authority from the Commissioner or Director of Insurance of every state they sell in."},
                 {"phrase1":"Automatic Premium Loan","phrase2":"A rider in a Life policy authorizing the insurance company to use the cash value to pay premiums not paid by the end of the grace period. May be present in Whole Life or Endowment policies only, never Term. This rider is free, but must be selected by the policy owner."},
                 {"phrase1":"Aviation Clause","phrase2":"Limits or excludes coverage when the insured is participating in specified types of air travel. Coverage is usually confined to regularly scheduled flights of commercial airlines. Often applies to student pilots."},
                 {"phrase1":"Beneficiary","phrase2":"A person who may become eligible to receive, or is receiving, benefits under an insurance plan. The beneficiary is selected by the policy owner and may be changed at any time, unless irrevocable."},
                 {"phrase1":"Brokerage","phrase2":"A Producer who represents an insured in the solicitation, negotiation, or procurement of contracts of insurance. For example, you might represent only one insurer as a Producer. If that insurer declines to write coverage for your client, you might try to broker the business elsewhere in an effort to better serve your customer."},
                 {"phrase1":"Business Insurance","phrase2":"Life or Health insurance written to cover business situations such as key person, sole proprietor, partnership, corporations, etc."},
                 {"phrase1":"Cash Dividend Option","phrase2":"A dividend option under which the policyholder receives the dividends in cash. Not subject to tax. Mutual insurers issue participating policies, which might pay dividends, but they are not guaranteed."},
                 {"phrase1":"Cash Surrender Value","phrase2":"The accumulated, guaranteed cash value in a Whole Life or Endowment policy at any given point in time. Most contracts do not develop a cash value until after the 3rd year. On Whole Life, the cash value will equal the face amount of the policy at age 100. Synonymous with Cash Value."},
                 {"phrase1":"Certificate","phrase2":"A statement evidencing that a policy has been written and stating the coverage in general. On Group insurance, the employer receives the master policy and the employees receive Certificates of Insurance."},
                 {"phrase1":"Claim","phrase2":"A demand for payment under the insurance policy."},
                 {"phrase1":"Classification","phrase2":"The grouping of persons for the purpose of determining an underwriting or rating group into which a particular risk must be placed. For example, on Whole Life, the standard rate for the average person at age 30 might be $10 per $1,000 of face amount. If the insured is sub-standard, the rate will be higher. A Preferred risk receives a discount from the standard rate."},
                 {"phrase1":"Collateral Assignment","phrase2":"Assignment of part of the proceeds of an insurance policy to a bank as collateral to settle the loan balance that may exist at the insured’s death."},
                 {"phrase1":"Common Disaster Provision","phrase2":"A provision in a Life contract that provides that the Primary Beneficiary must outlive the insured by a specified period of time in order to receive the proceeds. If not, then the Contingent Beneficiary receives the proceeds. The provision is designed to protect the rights of the Contingent Beneficiary in the event of simultaneous (or nearly simultaneous) death of the insured and the Primary Beneficiary. The time limit is usually 10, 15, or 30 days, depending on state law. Also known as the Uniform Simultaneous Death law."},
                 {"phrase1":"Concealment","phrase2":"The deliberate withholding of facts by an applicant for insurance that materially affects an insurance risk or loss."},
                 {"phrase1":"Conditional Receipt","phrase2":"In Life and Health insurance, a Conditional Receipt provides that if premium accompanies the application, coverage shall be in force from the date of application (whether the policy has yet been issued or not) provided the insurance company would have issued the coverage on the basis of facts as revealed by the application and other usual sources of underwriting information. Remember, there is never any coverage unless the premium has been paid! Conditions"},
                 {"phrase1":"Consideration","phrase2":"The exchange of value on which a contract is based. In Life and Health insurance, the Consideration is the premium and the statements in the application. Remember, consideration need not be equal. You might pay $1,000 in premium, but your policy will pay $100,000 if you die."},
                 {"phrase1":"Consideration Clause","phrase2":"A clause in a Life policy specifying the premium due for the insurance protection and the frequency of payment (also called Mode). The more frequent the Mode of Payment, the higher the cost, since most insurers charge service fees for budget payments. The cheapest Mode is annual."},
                 {"phrase1":"Contingent Beneficiary","phrase2":"Person or persons named to receive benefits if the Primary Beneficiary is not alive when the insured dies. For example, the Primary Beneficiary might be your spouse and the Contingent Beneficiary might be your children."},
                 {"phrase1":"Contract","phrase2":"A legal agreement between two parties for consideration, such as an insurance policy. To hold up in court, contracts must contain 4 required elements"},
                 {"phrase1":"Contributory Group","phrase2":"Group insurance for which the employees pay part of the premium. If the group is contributory, at least 75% of those eligible must enroll in order to prevent adverse selection. In noncontributory groups, 100% must enroll."},
                 {"phrase1":"Controlled Business","phrase2":"Life-insurance coverage written on the producer’s own life and on the lives of such persons as the producer’s relatives and business associates. The amount of controlled business a producer may write is restricted in most states, often to a maximum of 50% in a 12 month period."},
                 {"phrase1":"Convertible Term Insurance","phrase2":"A Term Life policy that can be converted any time to a permanent type of coverage without proof of insurability. Conversion premiums are based on current age and coverage cannot be increased. Most Term is convertible, but not all. Most Group insurance (which is usually Annual Renewable Term) is convertible by law during its 31 day grace period."},
                 {"phrase1":"Credit Insurance","phrase2":"Insurance on a debtor in favor of a lender, intended to pay off a loan or the balance due thereon if the insured dies or is disabled. Credit Life is a type of decreasing term insurance and the face amount of the policy is limited to the amount of the loan. Generally not used as Mortgage Protection Insurance."},
                 {"phrase1":"Death Benefit","phrase2":"The policy proceeds to be paid upon the death of the insured. On Life insurance, proceeds are not taxable, but may be included in the value of the insured’s estate for estate tax purposes."},
                 {"phrase1":"Deductible","phrase2":"Dollars or percentage of expense that will not be reimbursed by the insurer. The purpose of the deductible is to hold down the cost of insurance. The higher the deductible, the lower the premium."},
                 {"phrase1":"Decreasing Term Insurance","phrase2":"Term insurance whose amount of coverage starts out at the full amount, then gradually decreases until the expiration date of the policy. Generally, the cheapest type of Life insurance, but it has no cash value and cannot be renewed. Often used as Mortgage Protection insurance."},
                 {"phrase1":"Deferred Annuity","phrase2":"An Annuity on which payments to the annuitant are delayed until a specified future date. May be purchased with a single premium (a SPDA) or with flexible premiums. Interest earned during the accumulation (or pay in) period is tax deferred until withdrawal, when amounts above the annuitant’s invested capital (or cost basis) are taxed as ordinary income."},
                 {"phrase1":"Direct Writer","phrase2":"An insurance company that sells its policies through licensed producers who represent the insurer exclusively, rather than through independent local producers, who represent several insurance companies. Direct writing producers are also called Exclusive or captive producers."},
                 {"phrase1":"Dividend","phrase2":"The return of part of the premium paid for a Participating policy issued by a mutual insurer. It is unlawful to guarantee future dividends, but Producers may refer to the insurer’s past dividend payment history, if accurate. Mutual dividends are not taxable. However, dividends paid to stockholders of a stock insurer are taxable, since stock companies issue non-participating policies."},
                 {"phrase1":"Dividend Options","phrase2":"If a Mutual insurer declares a dividend, the policyholder has a choice of 5 dividend options, which can be changed at any time, including"},
                 {"phrase1":"Domestic Insurance Company","phrase2":"An insurance company formed under the laws of the state in which the insurance is written."},
                 {"phrase1":"Earned Premium","phrase2":"That portion of the premium for which policy protection has already been given. For example, if you buy a 1 year Health policy for a premium of $1,200 and the insurer cancels you exactly 6 months later, they are entitled to keep $600 (the earned premium), but they must also refund you $600, which is called the unearned premium. If they covered you for the entire year, all the premium would be earned. This concept also applies to P&C insurance, but not to Life insurance, where all premiums are considered to be fully earned upon payment."},
                 {"phrase1":"Effective Date","phrase2":"The date on which an insurance policy goes into effect and from which protection is furnished."},
                 {"phrase1":"Eligibility Period","phrase2":"The period during which the employee is eligible to obtain coverage under a Group Life or Health plan. Also known as the open enrollment period."},
                 {"phrase1":"Endorsement","phrase2":"A form attached to an insurance P&C policy changing the contract. Endorsements are called riders in Life and Health insurance. No change to a policy may become effective until approved by a company officer."},
                 {"phrase1":"Endowment Policy","phrase2":"A cash value life policy for which premiums are paid for a limited number of years, such as to age 65. If the insured is alive at the end of this premium-paying period, she receives the face amount of the policy. If the insured dies before maturity of the policy, the beneficiary receives the proceeds. Generally the most expensive type of cash value life insurance, since the policy reaches maturity prior to age 100. Endowments are often purchased to supplement retirement or for children’s educational purposes."},
                 {"phrase1":"Exclusions","phrase2":"Causes or conditions listed in the policy that are not covered and for which no benefits are payable. For example, in most states, suicide is excluded on a Life policy for the first 2 years. On Health insurance, intentional self inflicted injury is never covered."},
                 {"phrase1":"Experience","phrase2":"The loss record of an insured, a class of coverage, or an insurance company. For example, most large Group Life policies are rated based on the prior claims history of the group, which is called experience rating."},
                 {"phrase1":"Extended Term Option","phrase2":"A life-insurance non-forfeiture option under which the insured uses the policy’s cash-value to purchase one-year Term insurance in an amount equal to the original policy face amount. Although the policy holder could select the Extended Term Option at any time, if the policy lapses and no other non-forfeiture option has been selected, the policy will automatically go into Extended Term. Remember, there are 3 non-forfeiture options"},
                 {"phrase1":"Face Amount","phrase2":"The amount indicated on the face of a Life policy that will be paid at death or when a Whole Life policy matures at age 100. Also known as the Death Benefit or the policy limit. Not taxable."},
                 {"phrase1":"Family Income Rider","phrase2":"Added to a Whole Life policy for an additional premium, this rider is similar to the Decreasing Term Rider except that payments to the beneficiary are in the form of monthly income rather than a lump sum. For example, if you added a 10 year $100,000 FIR to your policy and died 5 years later, your family would receive $10,000 a year for 5 years PLUS the face amount of your Whole Life policy. Remember, the rider is term insurance and you must die in the term. If you died after 11 years, the rider would not cover, but the Whole Life would, since Whole Life is permanent insurance, covering to age 100."},
                 {"phrase1":"Family Plan Policy","phrase2":"A combination plan covering your entire family, usually with Permanent insurance on the father’s life, with mother and children automatically covered for lesser amounts (usually Term), all included under one premium."},
                 {"phrase1":"Fiduciary","phrase2":"A person who occupies a position of special trust and confidence when handling premiums on behalf of insureds and insurers. Insurance producers are considered to be fiduciaries."},
                 {"phrase1":"Fixed Amount Option","phrase2":"A Life insurance Settlement option under which the beneficiary receives a fixed amount (such as $500 a month) for an unspecified period of time. Payments continue until the principal and interest are depleted."},
                 {"phrase1":"Fixed Period Option","phrase2":"A Life insurance Settlement option under which the beneficiary receives a regular income for a specified period of time, such as 10 years, at which time the principal and interest are depleted. The name speaks for itself."},
                 {"phrase1":"Foreign Company","phrase2":"An insurer organized under laws of a state other than the one in which the insurance is written. For example, a company that is domestic to Illinois would be considered to be foreign in all other states."},
                 {"phrase1":"Fraud","phrase2":"An intentional misrepresentation made by a person with intent to gain advantage, and relied upon by a second party that suffers a loss. Fraud is the intent to deceive and can be very hard to prove."},
                 {"phrase1":"General Agent (G.A.)","phrase2":"An individual appointed by an insurer to administer its business in a given territory. Responsible for building the agency and service force. Compensation is on a commission override basis. Often called a Managing General Agent (M.G.A)."},
                 {"phrase1":"Grace Period","phrase2":"A period of time after premium due date during which a policy remains in force without penalty, even though the premium due has not been paid. If you don’t pay your premium on time, the grace period is the 1st policy provision to apply."},
                 {"phrase1":"Group Contract","phrase2":"A contract of insurance made with an employer or other entity that covers a group of people identified as individuals by reference to their relationship to the entity. A Group contract may be Life insurance, Health insurance, or an Annuity. Group insurance is usually less expensive than individual coverages. Remember, you cannot form a group just to buy insurance. It must exist for some other purpose."},
                 {"phrase1":"Group Life Insurance","phrase2":"Life insurance that a person is eligible to purchase through membership in a group. In an employer group, the employer receives the Master Policy and the employees receive Certificates of insurance. Group Life has a grace period of 31 days and is convertible to individual coverage without a physical exam based upon current age."},
                 {"phrase1":"Guaranteed Insurability","phrase2":"A rider in Life and Health contracts that permits the insured to buy additional prescribed amounts of insurance at prescribed future time intervals without evidence of insurability."},
                 {"phrase1":"Hazard","phrase2":"Any factor tending to make a policyholder a less-desirable risk for the insuring company. A hazard is something that increases the risk. Risk is defined as the chance of loss. For example, smoking is a hazard on both Life & Health insurance."},
                 {"phrase1":"Immediate Annuity","phrase2":"A lump-sum Annuity on which the income payments to the annuitant are to begin at once and continue for the life time of the annuitant. Immediate annuities have no accumulation period."},
                 {"phrase1":"Incontestable Clause","phrase2":"Provides that after the policy has been in force a certain length of time, the company can no longer contest it or void it, except for nonpayment of premiums. The time period is usually two years. In other words, Life & Health policies are contestable for the 1st two years, and incontestable thereafter. However, Health policies are always contestable for fraud! Indemnity"},
                 {"phrase1":"Insurable Interest","phrase2":"An interest in the life of an individual by which there will be a loss if the insured dies. The interest may be based on either a family relationship or on economic factors. Must exist at the time of application, not necessarily at the time of loss. If you would benefit if a person continues to live, you have an insurable interest in that person."},
                 {"phrase1":"Insurance","phrase2":"A contract or device for the transfer of pure risk to an insurer, who agrees, for a consideration, to indemnify or pay a specified amount for losses suffered by the insured. Risk is defined as the chance or uncertainty of loss. Pure risk is the chance of loss, with no chance for gain. It is the only type of risk that is insurable. Speculative risk, which is the chance for loss or gain, is not insurable."},
                 {"phrase1":"Insurance Age","phrase2":"An age upon which current premium rates may be established. It is commonly based on age at last birthday, age next birthday, or age at nearest birthday. Also known as original age."},
                 {"phrase1":"Insurance Commissioner","phrase2":"Common title for head of a state Department or Division of Insurance. Also known as the Director of Insurance in some states. Insurance is regulated by state law. The Commissioner’s job is to protect the insurance buying public by administering state insurance laws and regulations. The Commissioner does not make the laws, he enforces them."},
                 {"phrase1":"Insured","phrase2":"The party to an insurance contract to whom, or on behalf of, the insurance company agrees to indemnify for losses, provide benefits, or render services. In Prepaid Hospital Service plans (HMOs), the insured is called the subscriber."},
                 {"phrase1":"Insurer","phrase2":"The insurance company assuming risk and agreeing to pay claims or provide services. Insurers write indemnity plans, covering the insured. HMOs are not true insurance companies. They write prepaid service plans for their subscribers."},
                 {"phrase1":"Insuring Clause","phrase2":"The clause in a policy that specifies in brief the contract’s intent and benefits. Also known as the Insuring Agreement. It specifies the covered perils, such as accident and sickness on Health insurance. A peril is a cause of loss."},
                 {"phrase1":"Interest Option","phrase2":"A Life insurance settlement option under which the insurer keeps the insurance proceeds and invests them on behalf of the beneficiary. The beneficiary receives the interest from the investment. The proceeds remain the property of the beneficiary. The proceeds are not taxable but the interest earned is."},
                 {"phrase1":"Irrevocable Beneficiary","phrase2":"Once elected, cannot be changed without named beneficiary’s consent, since they have a vested interest in the policy benefits. A policy loan would also require the consent of the Irrevocable Beneficiary, since if you die with a loan outstanding, they would receive less."},
                 {"phrase1":"Joint Life and Survivor Annuity","phrase2":"Payments are made to two annuitants with the survivor continuing to receive payments after the first annuitant dies."},
                 {"phrase1":"Joint Life Annuity","phrase2":"Payments continue to two annuitants for only as long as both live. Payments stop entirely when the 1st annuitant dies. There is no survivorship, so monthly payments would actually be higher to the annuitants on a Joint Life Annuity than they would be on a Joint & Survivor Annuity, which pays until the last party dies."},
                 {"phrase1":"Jumping Juvenile","phrase2":"Juvenile Life insurance on which the face amount increases by a multiple, usually five, of the original face amount when the insured reaches 21. Used as a marketing tool to sell Life insurance covering children, whose rates are extremely low."},
                 {"phrase1":"Key Person Insurance","phrase2":"Life or Health insurance on important employees whose absence would cause the employer financial loss. The insurance is usually owned by and payable to the employer. Premiums are not tax deductible, but benefits are not taxed."},
                 {"phrase1":"Lapse","phrase2":"Termination of a policy because of failure to pay the premium. A policy lapses at the end of its grace period. For example, if you forget to pay your Whole Life premium when due, there is usually a 30 day grace period, during which time coverage continues until the policy lapses."},
                 {"phrase1":"Law of Large Numbers","phrase2":"An insurance company must protect losses on a homogeneous group. Risks are not usually considered insurable unless the insurer has a large enough base of previous loss experience to be able to accurately predict future losses. It is the Law of Large Numbers that makes accurate predictions of similar risks possible. Life insurance Mortality tables are based on groups of at least 10,000,000 people."},
                 {"phrase1":"Legal Reserve","phrase2":"The amount required as a reserve, to pay claims and benefits, as prescribed by state law as administered by the Insurance Commissioner. Insurance companies must file annual financial reports with the Commissioner proving their solvency."},
                 {"phrase1":"Level Premium Insurance","phrase2":"Life insurance, the premium for which remains at the same level (amount) throughout the life of the policy. For example, on traditional Whole Life, the premium is based upon the insured’s original age and it will never change."},
                 {"phrase1":"Level Term Insurance","phrase2":"The amount of insurance protection in a Term policy remains constant during the policy period, which could be 5 years, 10, 20 or even to age 65. For example, on a 5 year Level Term Life insurance policy the face amount and the premium would remain level for 5 years. At renewal at the end of the 5th year, premiums would increase based upon the next 5 year average age, but the face amount would remain the same. Remember, Term has no cash value and will eventually expire. To be covered, you must die in the term. The word term means time. Term insurance is considered to be temporary."},
                 {"phrase1":"Life Annuity","phrase2":"An Annuity that provides a periodic income to the annuitant during his lifetime. A straight Life Annuity has no beneficiary and is considered to be the most risky type of annuity. The annuitant is betting that he will live a long time, but the insurer is betting he is going to die. Remember, annuities are the opposite of life insurance! Annuities are not subject to underwriting, since there is no insurance protection."},
                 {"phrase1":"Life Annuity with Period Certain","phrase2":"An annuitant will receive payments for a specified number of years (such as 10) or for the rest of her life, whichever is longer. If the annuitant dies before all the guaranteed payments have been made, the beneficiary receives the payments for the rest of the certain period. The period certain is designed to eliminate some of the risk, but the longer the period certain is, the lower the annuitant’s monthly payments will be! Life Income Option: A Life insurance Settlement option that provides for payments during the entire life of the payee. Besides Joint and Survivor, there are three methods. • Straight Life Income The payee receives a specified income for life, with no refunds upon death. This is considered the most risky option, since there is no beneficiary. • Refund Annuity Income is paid for the lifetime of the payee and to a second payee if the first dies before receiving the full proceeds of the policy. This is the least risky option. • Life Income with Period Certain The payee receives installments for life with a second payee receiving the payments if the first dies before the end of the time specified in the Period Certain Period. The payee will not receive payments for life, only until the end of the Period Certain, which could be 5 years, 10, 15 or even 20 years, so there is still some risk!"},
                 {"phrase1":"Limited Pay Life","phrase2":"A Permanent Whole Life insurance policy on which premiums are paid for a specified number of years or to a specified age of the insured. Protection continues for the entire life of the insured.LP65 and 20-Pay Life are examples. A Life Paid up at age 65 is paid up at age 65, but the cash value does not equal the face amount of the policy until age 100 when the policy reaches maturity. Limited Pay Whole Life is more expensive than traditional Whole Life since the premiums must be paid within a shorter period of time."},
                 {"phrase1":"Loading","phrase2":"The amount added to the cost of mortality (death) to cover the operating expenses of the insurer, such as commissions and the cost of underwriting."},
                 {"phrase1":"Loan Value","phrase2":"That amount of Cash Value in a Whole Life or Endowment policy that may be borrowed by the insured. When you borrow from your policy, the insurer is loaning you their money and keeping your money as collateral. Since they usually have their funds invested, they will charge you annual interest on the loan (maximum 8% in most states). Loans don’t have to be paid back while you are alive, but will continue to accrue interest. Upon death, the amount of the unpaid loan plus accrued interest will be subtracted from proceeds."},
                 {"phrase1":"Loss Ratio","phrase2":"The percentage of losses to premiums usually losses incurred to premiums earned."},
                 {"phrase1":"Lump Sum","phrase2":"Proceeds of a policy taken all at once. A single amount."},
                 {"phrase1":"Manual Rates","phrase2":"Insurance rates according to a company Rate Manual that vary from company to company. Also known as Standard Rates. Most rates must be filed with the state Insurance Commissioner, but the insurance companies actually set their own rates in the competitive marketplace."},
                 {"phrase1":"Master Policy","phrase2":"The policy contract issued to the employer under a Group insurance plan. Remember, the employees covered by a group plan are considered to be insureds, but they only receive certificates."},
                 {"phrase1":"Material Misrepresentation","phrase2":"A misrepresentation that would have been important or essential to the underwriter’s decision to issue the policy. A misrepresentation is the applicant’s failure to tell the truth to the best of their knowledge."},
                 {"phrase1":"MIB","phrase2":"Medical Information Bureau. An organization serving as a clearinghouse of medical information on risks reported to it by insurance companies as a source of underwriting information on applicants."},
                 {"phrase1":"Misrepresentation","phrase2":"The use of written or oral statements of the insured, producer or insurance company misrepresenting the risk, terms, coverage, benefits, privileges or estimated future dividends of any policy."},
                 {"phrase1":"Misstatement of Age Clause","phrase2":"Provides that if misstatement of age is discovered after policy issue, the company can, if the insured is currently alive, adjust the premium amount on future premiums and request payment of the additional premium the policyholder should have paid; or if the insured has died, adjust the face amount of the policy to fit the premium that was paid at the correct age before paying the claim."},
                 {"phrase1":"Mode Premium","phrase2":"Premium paid according to the Mode of Payment selected by the policyholder, that is, monthly, quarterly, semi-annually, or annually. The less frequent the Mode, the lower the annual cost."},
                 {"phrase1":"Moral Hazard","phrase2":"A condition of morals or habits that increases the probability of a loss from a peril. Generally, a Moral Hazard is presented by a dishonest person."},
                 {"phrase1":"Mortality Table","phrase2":"A statistical table showing the number of deaths for all ages from 1 to 100. For example, if you are age 30, you could look at the table to find how many people your age will die this year, although the table cannot tell you which ones. Since the table tracks the life expectancies of 10 million people, it is very accurate. The 1980 CSO table is currently used by most companies, although companies (if large enough) are free to develop their own tables. Also known as the Law of Large Numbers."},
                 {"phrase1":"Mortgage Protection Policy","phrase2":"In Life insurance, a decreasing term policy from which the benefits are intended to pay off the balance due on a mortgage upon the death of the insured. Although Credit Life is very similar, in most states, Credit Life is used for consumer loans rather than mortgages."},
                 {"phrase1":"Mutual Insurance Company (Insurer)","phrase2":"An incorporated insurance company whose governing body is elected by the policyholders. The policyholders share in the success of the company through possible receipt of dividends. Mutual companies issue participating policies. Dividends are not taxable and may not be guaranteed."},
                 {"phrase1":"Net Cost","phrase2":"Premiums paid minus cash value and any policy dividends paid as of the date the calculation is being made."},
                 {"phrase1":"National Association of Insurance Commissioners (NAIC)","phrase2":"An organization made up of all the insurance commissioners of the various states designed to provide a way to exchange information and work toward uniformity of insurance regulation among the states. However, insurance laws are still far from uniform."},
                 {"phrase1":"Noncontributory","phrase2":"Any plan or program of insurance (usually Group) for which the employer pays the entire premium and the employee contributes no part of the premium. 100% participation is required."},
                 {"phrase1":"Non-forfeiture Option","phrase2":"A legal provision whereby the policyholder may take the accumulated cash values in a policy as 1) Reduced Paid-Up Permanent insurance; 2) Extended Term insurance, or 3) Surrender the policy for payment of its cash value, less any outstanding loans. Also known as Guaranteed Values. When surrendering for cash, any amount paid out in excess of premiums paid in is taxable as ordinary income. Once a policy is surrendered for cash, it may not be reinstated."},
                 {"phrase1":"Non-medical","phrase2":"Insurance issued without a medical exam. For example, if the applicant is young and is buying a small amount of Life insurance, no physical exam is required, so coverage may begin immediately."},
                 {"phrase1":"Non-participating","phrase2":"Insurance that does not pay policy dividends to policyholders, which are issued by stock insurance companies. Stock insurers may pay dividends, but if so, they are paid to the stock holders and they are taxable."},
                 {"phrase1":"Nonresident Producer","phrase2":"A producer licensed in a state in which he is not a resident. In most states, no exam is required to obtain a Nonresident license. You simply must prove that you are licensed and in good standing in your home state and pay the required fees. You can only have one resident license, but you can have 49 nonresident licenses, if desired."},
                 {"phrase1":"One-Year Term Dividend Option","phrase2":"A dividend option under which the insured has the company purchase one-year Term insurance with the dividend. For example, your dividend is $100, which you could have taken as cash. Instead, you have the insurer use the money to buy you an additional 1 year term policy at your current age. If you die in the term, your beneficiary will receive the proceeds of your Life policy PLUS the face amount of the one year term policy. At the end of the year, the term policy expires."},
                 {"phrase1":"Ordinary Life Insurance","phrase2":"Life insurance other than Industrial or Group. Ordinary life may be Whole Life, Endowment or Term. The grace period on all Ordinary Life insurance is 30 days. The Mortality Table is used to calculate the rates and benefits payable for Ordinary Life insurance."},
                 {"phrase1":"Original Age","phrase2":"The insured’s age when the policy was initially purchased. Often calculated based on the applicant’s closest birthday. Paid-Up Additions"},
                 {"phrase1":"Participating (Par)","phrase2":"Insurance that pays policy dividends to policy holders. Issued by a Mutual Company. Dividends may never be guaranteed and they are not taxable, since the IRS considers them to be a return of premium already paid."},
                 {"phrase1":"Partnership Insurance","phrase2":"Life or Health insurance sold to a partnership to protect against the loss of business continuity caused by the death or disability of a partner. For example, if your partner dies, his share of the business would go to his spouse who knows nothing about the business. To avoid this, you buy a Life insurance policy on your partner and he buys one on you. If he dies, the money goes to you tax free and you use it to buy out his spouse. A buy/sell agreement should be drafted by a lawyer and signed by all 4 parties"},
                 {"phrase1":"Payor Benefit","phrase2":"A rider or provision, usually found in Juvenile policies, under which premiums are waived if the Payor of the premium (usually a parent) becomes disabled or dies while the child is still a minor."},
                 {"phrase1":"Permanent Insurance","phrase2":"Whole life insurance is considered to be permanent since it covers you until you die or to age 100, whichever comes first. Term insurance is considered to be temporary."},
                 {"phrase1":"Policy Dividends","phrase2":"The policyholder’s share of a company’s divisible surplus which may be distributed to policy holders of a Mutual insurer at the discretion of their Board of Directors. Not taxable and not guaranteed."},
                 {"phrase1":"Policy Fee","phrase2":"A special, one-time premium charge to offset in whole or part the insurer’s first-year acquisition costs."},
                 {"phrase1":"Policyholder","phrase2":"The person who has the right to exercise the privileges and rights of ownership in the policy contract. Also called the policyowner."},
                 {"phrase1":"Policy Loan","phrase2":"A loan taken by the policyholder from the insurer using the insurance cash value as collateral. Insurers may defer requests for loans or for cash surrender up to six months. Loans are not taxable and need not by repaid, although interest will accrue on an annual basis. Upon death, any outstanding loans plus accrued interest will be subtracted from proceeds paid."},
                 {"phrase1":"Primary Beneficiary","phrase2":"Named beneficiary first to receive proceeds or benefits, if living, when proceeds or benefits are due. Unless revocable, the policyowner may change the primary beneficiary at any time. If there is no primary beneficiary, proceeds are payable to the Contingent Beneficiary. If there is neither, proceeds are payable to the estate of the insured, who is considered to be the final beneficiary. Remember, proceeds of a Life insurance policy are not taxable to the beneficiary."},
                 {"phrase1":"Principal Sum","phrase2":"On an AD&D policy, the amount payable in one sum in event of Accidental Death or severe accidental Dismemberment, which is defined as the loss of 2 limbs in the same occurrence. For loss of one limb, an AD&D policy will pay the Capital Sum, which is usually 50% of the Principal Sum."},
                 {"phrase1":"Proof of Loss","phrase2":"A formal statement by the insured to the insurance company regarding a loss. The purpose is to place before the company sufficient information concerning the loss to enable it to determine its liability under the policy. Although both are conditions in a Health insurance policy, don’t confuse Notice of Claim (which must be given within 20 days) with Proof of Loss, which must be submitted within 90 days."},
                 {"phrase1":"Rate","phrase2":"The per-unit cost of insurance. Life insurance is rated based on units of $1,000. For example, the rate for Whole life for a 30 year old might by $10 per thousand, so if the applicant buys a $100,000 policy, his premium would be $1,000 a year. The more you buy, the lower the rate per unit."},
                 {"phrase1":"Rated","phrase2":"A policy issued with an extra premium charge because of physical impairment or dangerous hobby. A surcharge added to the rate per unit on Life insurance. For example, the standard rate for a 30 year old buying Whole life might be $10 per thousand, but due to his health, the insurer adds a surcharge of $2 per thousand, so his cost per unit is $12 instead of $10, so his premium for a $100,000 policy is $1,200 instead of $1,000."},
                 {"phrase1":"Rated-Up Policy","phrase2":"A policy issued to an applicant that reflects a higher rate, due to the presence of a greater risk, in the eyes of the underwriter. Rated-up policies often result from substandard health revealed in a medical examination or dangerous hobbies or occupations. See the two definitions immediately above."},
                 {"phrase1":"Rebating","phrase2":"Illegal in most states, rebating involves the payment of something (usually part of the commission) not stated in the policy to the applicant as an inducement to the sale. You can take your client to lunch, but you cannot say I will pay for lunch if you buy this policy from me. Dividends are not considered to be rebates since it is stated in the policy that a dividend might be payable."},
                 {"phrase1":"Reduced Paid-Up Insurance Option","phrase2":"A Life insurance Non-forfeiture option under which the insured uses the cash value of his present policy to purchase a single-premium Whole Life policy, at his attained age, for a reduced face amount, to age 100. No physical exam is required and the insured may select this option at any time as long as there is a cash value."},
                 {"phrase1":"Reduced-Premium Dividend Option","phrase2":"A Dividend option on a participating life policy under which the policyholder has the dividend applied to the next premium due on the policy and he only has to pay the difference. For example, if the dividend is $100 and the premium is $1,000, than the insured would only have to pay $900."},
                 {"phrase1":"Refund Life Annuity","phrase2":"Provides annuity payments for the annuitant’s lifetime with the guarantee that in no event will total income be less than the purchase price of the contract. If the annuitant dies before receiving this amount, the difference is paid to a named beneficiary either as a cash refund or in installments."},
                 {"phrase1":"Reinstatement","phrase2":"When a Life policy lapses at the end of the grace period, the policy holder may apply for reinstatement by paying all back premiums and by passing a physical exam. The main advantage to reinstating rather than buying a new policy, is that the reinstated policy is based upon the insured’s original age. However, a policy that has been surrendered for cash may not be reinstated."},
                 {"phrase1":"Reinsurance","phrase2":"Agreement between insurance companies under which one company accepts all or part of the risk of loss of the other."},
                 {"phrase1":"Renewable Term","phrase2":"Term insurance that can be renewed without proof of the insured’s insurability, up to a certain specified maximum age. Most Group life insurance is Annual Renewable Term. Individual policies are often written as 5 year, 10, 15 or 20 year renewal term. The face amount is level, but the premiums will go up at renewal, since they are based upon the average age of the insured."},
                 {"phrase1":"Representations","phrase2":"Facts that the applicant represents as true and accurate to the best of his knowledge and belief."},
                 {"phrase1":"Reserve","phrase2":"The amount that, when increased by future premiums on outstanding policies and interest on those premiums, will enable the company to pay future death claims and cash surrenders."},
                 {"phrase1":"Rider","phrase2":"A form attached to a policy that modifies the conditions of the policy by expanding or decreasing its benefits or excluding certain conditions from coverage. Also known as an endorsement. Most riders cost extra, but the additional premium paid does not go towards cash value accumulation. Most riders (such as double indemnity) will drop off a Life policy automatically at age 65. Most riders are added at policy issue, but they may also be added later on with the mutual consent of the parties."},
                 {"phrase1":"Risk","phrase2":"The uncertainty of loss that exists whenever more than one outcome is possible. In the area of Life insurance, death is certain, but time of death is uncertain. Also known as the chance of loss. Remember, only pure risk is insurable. Pure risk is the chance of loss without any chance for gain."},
                 {"phrase1":"Risk Selection","phrase2":"The process of selecting insureds with a normal claims expectancy, also known as underwriting or risk classification. Since most insurance companies are in business to make money, it is the underwriters job to select business that will generate an underwriting profit."},
                 {"phrase1":"Settlement Option","phrase2":"Generally, there are 5 Life insurance Settlement Options: Cash, Interest, Fixed Period, Fixed Amount or the beneficiary may use the proceeds of the policy to purchase an Annuity. Remember, proceeds of a Life policy are tax free. However, if the beneficiary selects the Interest Option, the interest will be taxable."},
                 {"phrase1":"Single-Premium Annuity","phrase2":"An Annuity purchased with one lump-sum payment, generally with after tax dollars. You can buy either a Single Premium Immediate Annuity, which allows you to annuitize right away, or you can buy a Single Premium Deferred Annuity, where you annuitize sometime in the future, perhaps at retirement age."},
                 {"phrase1":"Single-Premium Policy","phrase2":"A Life insurance policy on which the entire premium is paid in one payment, which creates an immediate cash value. Remember, in lieu of a traditional Whole life policy where payments are payable to age 100, you can buy a Limited Pay Whole Life policy, such as a LP 65, a 20 Pay Life or even a 1 Pay life. Universal Life policies were often purchased with a single premium before tax law rules regarding Modified Endowment Contracts (MECs) were adopted."},
                 {"phrase1":"Standard","phrase2":"A risk that meets the same conditions of health, physical condition, and other underwriting criteria used by actuaries when developing rates and benefits from a Mortality or Morbidity Table. The Standard Risk is also known as the Average Risk. Remember, most people are insurable. It is just a matter of classifying them into the proper rating category"},
                 {"phrase1":"Standard Non-forfeiture Law","phrase2":"A law adopted by most states that provides that any cash-value accumulation or its equivalent must be made available to the policyholder should he stop paying the premiums. Any time a cash value Life insurance policy lapses, the policy owner must be given the choice of 3 Non-forfeiture options"},
                 {"phrase1":"Stated Amount","phrase2":"Relating to an agreement to pay a specified amount of money to or on behalf of the insured upon the occurrence of a defined loss. For example, the principal sum on an AD&D policy. AD&D and Life insurance are considered to be valued policies, since the amount payable in the event of a claim is determined when the policy is first issued. However, Health insurance follows the Principle of Indemnity, in that the policy will pay the policy limit or the amount of the claim, whichever is less."},
                 {"phrase1":"Stock Insurance Company","phrase2":"An incorporated insurance company with capital divided into shares and owned by the shareholders. Stock companies issue non-participating policies, in that dividends (if declared) are payable to the stockholders rather than to the policyholders, and are taxable."},
                 {"phrase1":"Substandard Risk","phrase2":"A risk not acceptable at standard rates. Also known as a non-standard risk or a rated risk. For example, you apply for Life insurance at standard rates. However, due to a health problem, the insurer declines to insure you. Instead, they make you a counter-offer, agreeing to insure you if you pay a higher premium, or a rate up. You have the option of accepting or declining their counteroffer."},
                 {"phrase1":"Suicide Clause","phrase2":"An exclusion on a Life insurance policy that states that if the insured commits suicide within a specified period of time, the policy will be voided. Paid premiums are usually refunded to the beneficiary as a gesture of sympathy. The time limit is generally two years, except in Colorado where is just 1 year."},
                 {"phrase1":"Surrender","phrase2":"Withdrawing the cash value of a Life policy and surrendering the policy to the insurer. No further coverage exists and the policy may not be reinstated. Cash Surrender is one of the 3 required Nonforfeiture options. A policy may be surrendered for cash at any time. However, amounts received in excess of premiums paid upon cash surrender are taxable."},
                 {"phrase1":"Term Insurance","phrase2":"Life insurance that normally does not have cash accumulation and is issued to remain in force for a specified period of time, following which it is subject to renewal or termination. Term insurance is considered to be temporary coverage. Remember, the word term means time. Term policies only cover you for a period of time and you must die in the term in order to be covered. Whole life, however, is permanent in that it covers you until you die."},
                 {"phrase1":"Tertiary Beneficiary","phrase2":"Next in line behind the Contingent Beneficiary to receive policy proceeds if both the Primary and Contingent Beneficiaries are deceased. Also known as the Final Beneficiary, which is usually the estate of the insured. The word Tertiary means third."},
                 {"phrase1":"Twisting","phrase2":"Inducing a policyholder by misrepresentation to terminate an existing Life policy in order to replace it with a new policy. Producers are naturally tempted to engage in replacement, since the commission paid on new policies generally exceeds the commissions paid on renewal policies. Replacement is not illegal, unless it is detrimental to the client. However, Twisting the facts in order to induce replacement is an illegal and/or unethical trade practice."},
                 {"phrase1":"Unauthorized Company","phrase2":"An insurer not permitted to sell insurance within a state, except for Surplus Lines or Reinsurance companies. All insurers must be authorized, which means they must obtain a Certificate of Authority from the state. However, Surplus Lines companies (such as Lloyds of London) and companies who reinsure other companies are exempt from this requirement. Most states allow Surplus Lines companies (who are unauthorized) to write the risks that authorized companies won’t take. Surplus Lines companies do not participate in the State Guarantee Fund or Association and are generally unregulated as to rates and policy forms used."},
                 {"phrase1":"Underwriter","phrase2":"1) A salaried company employee trained in evaluating risks and selecting the proper rates and coverages. No license is required. 2) A producer, especially a Life-insurance producer, is considered to be a Field Underwriter or Front Line Underwriter. In theory, the producer is supposed to do some underwriting before submitting the application to the home office underwriter in order to assist in making a decision on the basis of known facts. The producer is required to report all facts known to him or her that might affect the risk. Remember, the producer represents the insurer, not the insured."},
                 {"phrase1":"Underwriting","phrase2":"The process of evaluating a risk for the purpose of issuing insurance coverage. Also known as risk classification. The underwriters job is to select business that fits into the rate structure of the insurer, allowing the insurer to not only pay claims and expenses, but to make an underwriting profit."},
                 {"phrase1":"Unearned Premium","phrase2":"That portion of an advance premium payment that has not yet been used for coverage written. Thus, in the case of an annual premium, at the end of the first month of the premium period, 11 months of the premium would still be unearned. So, if the insurer cancelled a Health policy that had an annual premium of $1,200 after 1 month on a pro-rata basis, they would have to refund $1,100 in unearned premium."},
                 {"phrase1":"Uniform Simultaneous Death Act","phrase2":"A uniform law adopted by most states providing that if the Primary Beneficiary and the insured die in the same accident and there is no proof that the beneficiary outlived the insured, the proceeds are paid as if the Primary Beneficiary died first, which means that the proceeds are paid to the Contingent Beneficiary. Also known as the Common Disaster provision."},
                 {"phrase1":"Variable Annuity","phrase2":"An Annuity contract in which the amount of the periodic benefits varies, usually in relation to the value of securities invested in a separate account, which is very similar to a mutual fund. Producers selling variable annuities or variable life insurance must also pass the NASD Series 6 or 7 exam and be registered with the Securities Exchange Commission (SEC), since securities are regulated by federal law. Further, most states require that producers selling variable products obtain a Variable Products endorsement to their state Life insurance license."},
                 {"phrase1":"Waiver","phrase2":"1) A rider excluding liability for a stated cause of accident or sickness. Also known as an impairment rider. 2) A provision or rider agreeing to waive premium payment during a period of disability. Also known as Waiver of Premium. 3) The giving up or surrender of a right or privilege that is known to exist. For example, the underwriter has the right to require applicants to complete all the questions on the application. If the underwriter accepts an incomplete application, they have waived the right to obtain it later. Once a right is waived, it can no longer be asserted. This is known as Estoppel."},
                 {"phrase1":"Warranty","phrase2":"A statement made on an application for Property & Casualty insurance that is warranted to be true in all respects. If untrue in any respect, even though the untruth may not have been known to the person giving the warranty, the contract may be voided without regard to the materiality of the statement. Statements on Life and Health insurance applications are, in the absence of fraud, not warranties, but representations."},
                 {"phrase1":"War Clause","phrase2":"This generally excludes coverage for persons serving in the armed forces during the time of war, whether on the battlefield or not."},
                 {"phrase1":"Whole Life","phrase2":"A Life policy that runs for the insured’s whole life that is, until death or the ultimate age on the mortality table being used (age 100). Premiums for a Whole Life policy may be paid for the whole life or for a limited period (for example, 20-Pay-Life or LP65) during which the higher premium charged pays up the policy. Also known as permanent insurance."}];
    var key = "Life Terms";
    var key2 = "Life Glossary";
    var key3 = "My Deck";
    var deck = new Deck(key);
    var deck2 = new Deck(key2);
    var myDeck = new Deck(key3);
    for (var ndx=0; ndx < data.length; ndx++) {
        var newCard = new Card(data[ndx]);
        newCard.save();
        deck.add(newCard);
    }
    for (var ndx=0; ndx < terms.length; ndx++) {
    	var newCard2 = new Card(terms[ndx]);
    	newCard2.save();
    	deck2.add(newCard2);
    }
    
    
    deck.save();
    deck2.save();
    myDeck.save();
//    var key = 'deck-'+makeKey();
//    localStorage[key] = deck;
//    var d = new Deck(key);
//    d.name = 'Life Terms';
//    d.save();
    
    //add to mgr and cleanup
    DECKMGR.deck_add(key);
    DECKMGR.deck_add(key2);
    DECKMGR.deck_add(key3);
    DECKMGR.deck_load(1);
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
//Copy card to student personal deck
function copyCard() {
	var card = DECKMGR.active().current();
	if (DECKMGR.active().name != 'My Deck'){
		var myDeckName = DECKMGR.decks[2];
		var deck = new Deck(myDeckName);
		deck.name=myDeckName;
		deck.key = myDeckName;
		deck.add(card);
		deck.save();
		DECKMGR.save();
	}else{
		DECKMGR.active().deleteCard(card);
		updateDisplay();
		
	}
	
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
	var windowWidth = $(window).width();
	$('body').height(windowHeight);
	$('body').width(windowWidth);
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

