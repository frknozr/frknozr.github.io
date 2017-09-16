function readTextFile(file)
{
    var allText;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
                
            }
        }
    }
    rawFile.send(null);
    return(allText);
}

//var words = readTextFile("http://humanstxt.org/humans.txt")
var temp = readTextFile("https://synack.blog/posts/detect-obfuscation/half_corpus")
var words = temp.split("\n");


Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}


var getBaseLog = function(y, x) {
  return Math.log(y) / Math.log(x);
}

var get_evaluation_factor = function(word){
    return word.length * (getBaseLog(unknown_transition,BASE) / 2.5);
}

var unknown_transition = 0.000001;
var BASE = 2;


function Table(){
    this.body = {};
    
    this.get_keys = function(){
        keys = [];
        for(var i in this.body){
            keys.push(i);
        }
        return keys;
    }

    this.merge_letters = function(ngram,letters){
        letters_keys = letters.get_keys();
        for(var i=0;i<letters_keys.length;i++){
            var key = keys[i];
            this.body[ngram].update(key,letters.get(key))
        }
    };

    this.add = function(ngram,letters){
        keys = this.get_keys()
        if(keys.contains(ngram)){
            this.merge_letters(ngram,letters);
        }
        else{
            this.body[ngram] = letters
        }
    };

    this.calculate = function(){
        keys = this.get_keys();
        for(var i=0;i<keys.length;i++){
            var key = keys[i];
            this.body[key].calculate();
        }
    };

    this.get_probability = function(ngram,letter){
        if(this.body[ngram] === undefined){
            return unknown_transition;
        }
        else{
            if(this.body[ngram].get(letter) === undefined){
                console.log(ngram)
                return unknown_transition;
            }
            
            else{
                console.log(ngram)
                return this.body[ngram].get(letter)

            }
        }
        
    };

    this.print_table = function(){
        keys = this.get_keys();
        for(var i=0;i<keys.length;i++){
            var key = keys[i];
            console.log(key);
            this.body[key].print_letters();
        }
    };
}


function Letters(){
    this.body = {};

    this.get = function(key){
        return this.body[key];
    };

    this.get_keys = function(){
        keys = [];
        for(var i in this.body){
            keys.push(i);
        }
        return keys;
    };

    this.add = function(letter){
        keys = this.get_keys();
        if(keys.contains(letter)){
            this.body[letter]++;
        }
        else{
            this.body[letter] = 1;
        }
    }

    this.update = function(letter,num){
        keys = this.get_keys();
        if(keys.contains(letter)){
            this.body[letter] = this.body[letter] + num;
        }
        else{
            this.body[letter] = 1;
        }
    }

    this.calculate = function(){
        acc = 0;
        keys = this.get_keys();
        for(var i=0;i<keys.length;i++){
            var key = keys[i];
            acc += this.body[key];
        }

        for(var i=0;i<keys.length;i++){
            var key = keys[i];
            this.body[key] = this.body[key] / acc;
        }
        console.log("calculate worked");
    }

    this.print_letters = function(){
        console.log(this.body);
    }
}


var build_model = function(t){
    create_table(words,t);
    console.log("model created")
}

var create_table = function(words,t){
    N = 2;
    for(var i=0;i<words.length;i++){
        word = words[i];
        ngrams = create_ngram(N,word);
        for(var key in ngrams){
            var l = new Letters();
            l.add(ngrams[key]);
            t.add(key,l);
        }
    }
    console.log("table created")
}


var create_ngram = function(n,string){
    size = string.length;
    step = n - 1;
    ngrams = [];
    ngrams_ = {};
    for(var i=0;i<size-step;i++){
        ngram = "";
        for(var j=i;j<i+n;j++){
            ngram = ngram + string[j];
        }
        ngrams.push(ngram);
    }

    for(var i=0;i<ngrams.length-1;i++){
        var temp = ngrams[i+1];
        ngrams_[ngrams[i]] = temp[step];
    }
    return ngrams_;
}

var calculate_probability = function(word,t){
    N=2;
    sum_prob=0;
    ngrams = create_ngram(N,word);
    for(var key in ngrams){
        ngram = key;
        letter = ngrams[key];
        prob = t.get_probability(key,ngrams[key])
        sum_prob = sum_prob + getBaseLog(prob,BASE);
    }
    evaluation_value = get_evaluation_factor(word);
    console.log(evaluation_value);
    console.log(sum_prob);
    if(evaluation_value > sum_prob){
        console.log("random");
        return {"status":false,"prob":sum_prob,"eval":evaluation_value};
    }
    else{
        console.log("leigt");
        return {"status":true,"prob":sum_prob,"eval":evaluation_value};
    }
}

var run = function(word){

    result = calculate_probability(word,t);
    return result;
}

var t = new Table();
build_model(t);
t.calculate();
