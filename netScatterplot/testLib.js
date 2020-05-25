((window)=>{
  window.MyLib = function(firstName, lastName){
    this.firstName = firstName;
    this.lastName = lastName;
    function f1(name){
      console.log(name);
    }
    function greet(){
      let name = this.firstName + this.lastName;
      f1(name);
    }
    //Expose
    this.greet = greet;
  };
  window.Student = class Student{
    constructor(fName, lName){
      this.fName = fName;
      this.lName = lName;
    }

    greet(){
      let name  = this.fName + this.lName;
      f1(name);
      function f1(name){
        console.log(name);
      }
    }
  }
})(window);
