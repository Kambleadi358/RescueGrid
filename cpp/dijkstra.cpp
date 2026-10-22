#include <iostream>
#include <queue>
#include <vector>
using namespace std; struct Edge{int v,w;bool blocked;};
// O((V+E) log V) with a min-priority queue; all costs must be nonnegative.
int main(){vector<vector<Edge>>g(3);g[0]={{1,5,false},{2,20,false}};g[1]={{2,4,false}};vector<int>d(3,1e9);priority_queue<pair<int,int>,vector<pair<int,int>>,greater<>>pq;d[0]=0;pq.push({0,0});while(!pq.empty()){auto[x,u]=pq.top();pq.pop();if(x!=d[u])continue;for(auto e:g[u])if(!e.blocked&&x+e.w<d[e.v])d[e.v]=x+e.w,pq.push({d[e.v],e.v});}cout<<"Minimum cost 0 to 2: "<<d[2];}
